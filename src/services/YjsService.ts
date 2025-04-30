import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { store } from '../store';
import { 
  setCollaborativeDocument, 
  setLocalAwareness,
  updatePeer,
  setConnectionStatus
} from '../store/slices/collaborationSlice';
import webRTCService from './WebRTCService';

interface UserInfo {
  id: string;
  name: string;
  color: string;
}

interface AwarenessState {
  user: UserInfo;
  cursor: { x: number; y: number } | null;
}

class YjsService {
  private ydoc: Y.Doc | null = null;
  private indexeddbProvider: IndexeddbPersistence | null = null;
  private flowchartData: Y.Map<any> | null = null;
  private nodesData: Y.Array<any> | null = null;
  private edgesData: Y.Array<any> | null = null;
  private documentId: string | null = null;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;
  private initialized: boolean = false;

  // Initialize the Yjs document with a given ID
  public async initialize(documentId: string): Promise<void> {
    if (this.ydoc && this.documentId === documentId && this.initialized) {
      // Already initialized with this document
      return;
    }

    // Clean up previous document if any
    this.cleanup();

    try {
      this.documentId = documentId;
      this.connectionAttempts = 0;

      // Create a new Yjs document
      this.ydoc = new Y.Doc();

      // Initialize data structures
      this.flowchartData = this.ydoc.getMap('flowchart');
      this.nodesData = this.ydoc.getArray('nodes');
      this.edgesData = this.ydoc.getArray('edges');

      // Use direct P2P communication through our custom WebRTC implementation
      // instead of relying on Y-js WebRTC provider with external signaling servers
      await this.initializeDirectP2P(documentId);

      // Set up persistence with IndexedDB for offline capabilities
      this.indexeddbProvider = new IndexeddbPersistence(`hapa-flowchart-${documentId}`, this.ydoc);
      
      // Wait for IndexedDB to load data (if any exists)
      await new Promise<void>((resolve) => {
        if (this.indexeddbProvider) {
          this.indexeddbProvider.on('synced', () => {
            console.log('IndexedDB data loaded');
            resolve();
          });
          
          // Timeout after 1 second if synced doesn't happen
          setTimeout(() => {
            console.log('IndexedDB sync timeout');
            resolve();
          }, 1000);
        } else {
          resolve();
        }
      });

      // Store only the document ID in Redux, not the Yjs document itself
      store.dispatch(setCollaborativeDocument({
        documentId
      }));
      
      // Mark the service as initialized
      this.initialized = true;

      console.log('Yjs initialized with document ID:', documentId);
    } catch (error) {
      console.error('Failed to initialize Yjs:', error);
      this.cleanup();
      throw error;
    }
  }

  // Initialize direct P2P connection without external signaling servers
  private async initializeDirectP2P(documentId: string): Promise<void> {
    try {
      console.log('Initializing direct P2P connection for document:', documentId);
      
      // Create local awareness state for this document
      this.setupLocalAwareness();

      // Let WebRTCService handle all the direct P2P connections
      // It will use Hyperswarm for peer discovery instead of external signaling servers
      
      // Mark as connected - P2P connections will be handled by WebRTCService
      store.dispatch(setConnectionStatus(true));
      
      // Subscribe to document changes from WebRTCService
      webRTCService.onFlowchartUpdate((data) => {
        if (data && this.ydoc) {
          console.log('Received flowchart update from WebRTCService:', data);
          this.applyRemoteChanges(data);
        }
      });
      
      console.log('Direct P2P connection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize direct P2P connection:', error);
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.connectionAttempts++;
        console.log(`Retrying connection (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
        await this.initializeDirectP2P(documentId);
      } else {
        throw error;
      }
    }
  }

  // Get the Yjs document (for components that need direct access)
  public getYDoc(): Y.Doc | null {
    return this.ydoc;
  }

  // Set up local awareness state without relying on WebRTC provider
  private setupLocalAwareness(): void {
    const localPeerId = webRTCService.getLocalPeerId() || 'unknown';
    const userInfo = {
      id: localPeerId,
      name: 'User ' + localPeerId.substring(0, 6),
      color: this.getRandomColor()
    };
    
    // Store local awareness state
    store.dispatch(setLocalAwareness({
      user: userInfo,
      cursor: null
    }));
    
    // Let WebRTCService know about our user info
    webRTCService.setLocalUserInfo(userInfo);
  }

  // Apply remote changes to local Yjs document
  private applyRemoteChanges(data: any): void {
    if (!this.ydoc) return;
    
    console.log('Applying remote changes to Yjs doc:', data);
    
    this.ydoc.transact(() => {
      // Update properties
      if (data.properties && this.flowchartData) {
        Object.entries(data.properties).forEach(([key, value]) => {
          this.flowchartData?.set(key, value);
        });
      }
      
      // Update nodes
      if (data.nodes && this.nodesData) {
        // Clear existing nodes
        this.nodesData.delete(0, this.nodesData.length);
        
        // Add new nodes
        if (Array.isArray(data.nodes)) {
          data.nodes.forEach((node: any) => {
            this.nodesData?.push([node]);
          });
        }
      }
      
      // Update edges
      if (data.edges && this.edgesData) {
        // Clear existing edges
        this.edgesData.delete(0, this.edgesData.length);
        
        // Add new edges
        if (Array.isArray(data.edges)) {
          data.edges.forEach((edge: any) => {
            this.edgesData?.push([edge]);
          });
        }
      }
    });
    
    // Notify subscribers
    this.notifyFlowchartUpdated();
  }

  // Subscribe to changes in the Yjs document
  private subscribeToChanges(): void {
    if (!this.ydoc) return;

    // Listen for flowchart data changes
    this.flowchartData?.observe(event => {
      console.log('Flowchart data changed:', event);
      this.notifyFlowchartUpdated();
    });

    // Listen for node changes
    this.nodesData?.observe(event => {
      console.log('Nodes data changed:', event);
      this.notifyFlowchartUpdated();
    });

    // Listen for edge changes
    this.edgesData?.observe(event => {
      console.log('Edges data changed:', event);
      this.notifyFlowchartUpdated();
    });
  }

  // Notify that the flowchart has been updated
  private notifyFlowchartUpdated(): void {
    // This would dispatch an action to update the flowchart in the Redux store
    // or trigger a callback to update the UI
    if (this.flowchartChangedCallback) {
      const flowchartData = this.getFlowchartData();
      console.log('Notifying flowchart updated:', flowchartData);
      this.flowchartChangedCallback();
    }
  }

  // Callback for flowchart changes
  private flowchartChangedCallback: (() => void) | null = null;

  // Set callback for flowchart changes
  public onFlowchartChanged(callback: () => void): void {
    this.flowchartChangedCallback = callback;
    
    // Subscribe to changes if not already
    this.subscribeToChanges();
    
    // Trigger initial update if we have data
    const flowchartData = this.getFlowchartData();
    if (flowchartData && (flowchartData.nodes.length > 0 || flowchartData.edges.length > 0)) {
      setTimeout(() => callback(), 100);
    }
  }

  // Update cursor position
  public updateCursorPosition(x: number, y: number): void {
    // Send cursor position via WebRTCService
    webRTCService.sendCursorPosition(x, y);
    
    // Update local awareness state in Redux
    store.dispatch(setLocalAwareness({
      user: store.getState().collaboration.localAwareness.user,
      cursor: { x, y }
    }));
  }

  // Update flowchart data
  public updateFlowchart(data: any): void {
    if (!this.ydoc) return;
    
    console.log('Updating flowchart data:', data);

    // Apply changes to the Yjs data structures
    this.ydoc?.transact(() => {
      // Update general flowchart properties
      if (data.properties) {
        Object.entries(data.properties).forEach(([key, value]) => {
          this.flowchartData?.set(key, value);
        });
      }

      // Update nodes
      if (data.nodes) {
        this.nodesData?.delete(0, this.nodesData.length);
        data.nodes.forEach((node: any) => {
          this.nodesData?.push([node]);
        });
      }

      // Update edges
      if (data.edges) {
        this.edgesData?.delete(0, this.edgesData.length);
        data.edges.forEach((edge: any) => {
          this.edgesData?.push([edge]);
        });
      }
    });

    // Also update through WebRTC for P2P synchronization
    webRTCService.sendFlowchartUpdate(data);
  }

  // Get the current flowchart data
  public getFlowchartData(): any {
    if (!this.flowchartData || !this.nodesData || !this.edgesData) {
      return null;
    }

    const data = {
      properties: this.flowchartData.toJSON(),
      nodes: this.nodesData.toArray(),
      edges: this.edgesData.toArray()
    };
    
    // Make sure nodes and edges are properly defined
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      console.error('Invalid flowchart data structure:', data);
      return {
        properties: data.properties,
        nodes: Array.isArray(data.nodes) ? data.nodes : [],
        edges: Array.isArray(data.edges) ? data.edges : []
      };
    }
    
    return data;
  }

  // Generate a random color for user identification
  private getRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA5A5',
      '#A5FFD6', '#A5C8FF', '#FFA5E0', '#DEFF79'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Check if this service is initialized
  public isInitialized(): boolean {
    return this.initialized;
  }

  // Clean up Yjs resources
  public cleanup(): void {
    this.initialized = false;
    
    if (this.indexeddbProvider) {
      this.indexeddbProvider.destroy();
      this.indexeddbProvider = null;
    }

    if (this.ydoc) {
      this.ydoc.destroy();
      this.ydoc = null;
    }

    this.flowchartData = null;
    this.nodesData = null;
    this.edgesData = null;
    this.documentId = null;
    this.flowchartChangedCallback = null;
  }
}

// Export as a singleton
const yjsService = new YjsService();
export default yjsService; 