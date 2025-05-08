import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { store } from '../store';
import { 
  setCollaborativeDocument, 
  setLocalAwareness
} from '../store/slices/collaborationSlice';
import p2pService from './P2PService';

interface UserInfo {
  id: string;
  name: string;
  color: string;
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
    // If already initialized with this document, just return
    if (this.ydoc && this.documentId === documentId && this.initialized) {
      console.log(`YjsService already initialized with document ID: ${documentId}`);
      return;
    }

    // If we have a different document open, clean it up first
    if (this.ydoc && this.documentId !== documentId) {
      await this.cleanup();
    }

    try {
      console.log(`Initializing YjsService with document ID: ${documentId}`);
      this.documentId = documentId;
      this.connectionAttempts = 0;

      // Create a new Yjs document
      this.ydoc = new Y.Doc();

      // Initialize data structures
      this.flowchartData = this.ydoc.getMap('flowchart');
      this.nodesData = this.ydoc.getArray('nodes');
      this.edgesData = this.ydoc.getArray('edges');

      // Use P2P service for communication and peer discovery
      await this.initializeP2PConnection(documentId);

      // Set up persistence with IndexedDB for offline capabilities
      if (!this.indexeddbProvider) {
        this.indexeddbProvider = new IndexeddbPersistence(`hapa-flowchart-${documentId}`, this.ydoc);
      }
      
      // Wait for IndexedDB to load data (if any exists)
      await new Promise<void>((resolve) => {
        if (this.indexeddbProvider) {
          const syncTimeout = setTimeout(() => {
            console.log('IndexedDB sync timeout');
            resolve();
          }, 1000);
          
          this.indexeddbProvider.on('synced', () => {
            clearTimeout(syncTimeout);
            console.log('IndexedDB data loaded');
            resolve();
          });
        } else {
          resolve();
        }
      });

      // Store only the document ID in Redux, not the Yjs document itself
      store.dispatch(setCollaborativeDocument({
        documentId
      }));
      
      // Subscribe to document changes
      this.subscribeToChanges();
      
      // Mark the service as initialized
      this.initialized = true;

      console.log('Yjs initialized with document ID:', documentId);
    } catch (error) {
      console.error('Failed to initialize Yjs:', error);
      this.cleanup();
      throw error;
    }
  }

  // Initialize P2P connection
  private async initializeP2PConnection(documentId: string): Promise<void> {
    try {
      console.log('Initializing P2P connection for document:', documentId);
      
      // Set up local awareness state for this document
      this.setupLocalAwareness();

      // First initialize the P2P service
      await p2pService.initialize();
      
      // Just join directly with the document ID as the key
      // This prevents recursive key generation between services
      await p2pService.joinSharedFlowchart(documentId);
      console.log(`Joined flowchart with key: ${documentId}`);
      
      // Subscribe to flowchart updates from P2P connections
      p2pService.onFlowchartUpdate((data) => {
        if (data && this.ydoc) {
          console.log('Received flowchart update from P2P:', data);
          this.applyRemoteChanges(data);
        }
      });
      
      // Send initial flowchart data if we have it
      setTimeout(() => {
        const currentData = this.getFlowchartData();
        if (currentData && (currentData.nodes?.length > 0 || currentData.edges?.length > 0)) {
          console.log('Sending initial flowchart data:', currentData);
          p2pService.sendFlowchartUpdate({
            initialData: {
              nodes: currentData.nodes,
              edges: currentData.edges
            }
          });
        }
      }, 500);
      
      console.log('P2P connection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize P2P connection:', error);
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.connectionAttempts++;
        console.log(`Retrying connection (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
        await this.initializeP2PConnection(documentId);
      } else {
        throw error;
      }
    }
  }

  // Get the Yjs document (for components that need direct access)
  public getYDoc(): Y.Doc | null {
    return this.ydoc;
  }

  // Set up local awareness state
  private setupLocalAwareness(): void {
    const localPeerId = p2pService.getLocalPeerId() || 'unknown';
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
    
    // Let P2P service know about our user info
    p2pService.setLocalUserInfo(userInfo);
  }

  // Apply remote changes to local Yjs document
  private applyRemoteChanges(data: any): void {
    if (!this.ydoc) return;
    
    console.log('Applying remote changes to Yjs doc:', data);
    
    // Handle initial data sync
    if (data.initialData) {
      console.log('Received initial flowchart data:', data.initialData);
      
      this.ydoc.transact(() => {
        // Update nodes
        if (Array.isArray(data.initialData.nodes)) {
          // Clear existing nodes
          if (this.nodesData) {
            this.nodesData.delete(0, this.nodesData.length);
            
            // Add new nodes
            data.initialData.nodes.forEach((node: any) => {
              if (this.nodesData) {
                this.nodesData.push([node]);
              }
            });
          }
          
          // Also update in flowchart map
          if (this.flowchartData) {
            this.flowchartData.set('nodes', data.initialData.nodes);
          }
        }
        
        // Update edges
        if (Array.isArray(data.initialData.edges)) {
          // Clear existing edges
          if (this.edgesData) {
            this.edgesData.delete(0, this.edgesData.length);
            
            // Add new edges
            data.initialData.edges.forEach((edge: any) => {
              if (this.edgesData) {
                this.edgesData.push([edge]);
              }
            });
          }
          
          // Also update in flowchart map
          if (this.flowchartData) {
            this.flowchartData.set('edges', data.initialData.edges);
          }
        }
      });
    } else if (data.requestInitialData) {
      // Someone is requesting the initial data, send it
      console.log('Peer requested initial flowchart data');
      
      const currentData = this.getFlowchartData();
      if (currentData && (currentData.nodes?.length > 0 || currentData.edges?.length > 0)) {
        console.log('Sending initial flowchart data in response to request:', currentData);
        p2pService.sendFlowchartUpdate({
          initialData: {
            nodes: currentData.nodes,
            edges: currentData.edges
          }
        });
      }
    } else if (data.nodeOperation) {
      // Handle node operations
      console.log('Applying node operation:', data.nodeOperation);
      
      if (data.nodeOperation.type === 'add' && data.nodeOperation.node) {
        // Add a new node
        const node = data.nodeOperation.node;
        this.ydoc.transact(() => {
          if (this.nodesData) {
            // Check if the node already exists
            const existingIndex = this.findNodeIndex(node.id);
            if (existingIndex === -1) {
              console.log('Adding new node:', node);
              this.nodesData.push([node]);
            } else {
              console.log('Node already exists, not adding:', node.id);
            }
          }
        });
      } else if (data.nodeOperation.type === 'move' && data.nodeOperation.id && data.nodeOperation.position) {
        // Update node position
        this.ydoc.transact(() => {
          if (this.nodesData) {
            const index = this.findNodeIndex(data.nodeOperation.id);
            if (index !== -1) {
              const node = this.nodesData.get(index);
              node.position = data.nodeOperation.position;
              this.nodesData.delete(index, 1);
              this.nodesData.insert(index, [node]);
              console.log('Updated node position:', data.nodeOperation.id, data.nodeOperation.position);
            }
          }
        });
      } else if (data.nodeOperation.type === 'update' && data.nodeOperation.id && data.nodeOperation.data) {
        // Update node data
        this.ydoc.transact(() => {
          if (this.nodesData) {
            const index = this.findNodeIndex(data.nodeOperation.id);
            if (index !== -1) {
              const node = this.nodesData.get(index);
              node.data = { ...node.data, ...data.nodeOperation.data };
              this.nodesData.delete(index, 1);
              this.nodesData.insert(index, [node]);
              console.log('Updated node data:', data.nodeOperation.id, data.nodeOperation.data);
            }
          }
        });
      } else if (data.nodeOperation.type === 'delete' && data.nodeOperation.id) {
        // Delete a node
        this.ydoc.transact(() => {
          if (this.nodesData) {
            const index = this.findNodeIndex(data.nodeOperation.id);
            if (index !== -1) {
              this.nodesData.delete(index, 1);
              console.log('Deleted node:', data.nodeOperation.id);
            }
          }
        });
      }
    } else if (data.edgeOperation) {
      // Handle edge operations
      console.log('Applying edge operation:', data.edgeOperation);
      
      if (data.edgeOperation.type === 'add' && data.edgeOperation.edge) {
        // Add a new edge
        const edge = data.edgeOperation.edge;
        this.ydoc.transact(() => {
          if (this.edgesData) {
            // Check if the edge already exists
            const existingIndex = this.findEdgeIndex(edge.id);
            if (existingIndex === -1) {
              console.log('Adding new edge:', edge);
              this.edgesData.push([edge]);
            } else {
              console.log('Edge already exists, not adding:', edge.id);
            }
          }
        });
      } else if (data.edgeOperation.type === 'update' && data.edgeOperation.id && data.edgeOperation.data) {
        // Update edge data
        this.ydoc.transact(() => {
          if (this.edgesData) {
            const index = this.findEdgeIndex(data.edgeOperation.id);
            if (index !== -1) {
              const edge = this.edgesData.get(index);
              edge.data = { ...edge.data, ...data.edgeOperation.data };
              this.edgesData.delete(index, 1);
              this.edgesData.insert(index, [edge]);
              console.log('Updated edge data:', data.edgeOperation.id, data.edgeOperation.data);
            }
          }
        });
      } else if (data.edgeOperation.type === 'delete' && data.edgeOperation.id) {
        // Delete an edge
        this.ydoc.transact(() => {
          if (this.edgesData) {
            const index = this.findEdgeIndex(data.edgeOperation.id);
            if (index !== -1) {
              this.edgesData.delete(index, 1);
              console.log('Deleted edge:', data.edgeOperation.id);
            }
          }
        });
      }
    }
    
    // Notify subscribers
    this.notifyFlowchartUpdated();
  }
  
  // Find the index of a node in the nodes array
  private findNodeIndex(nodeId: string): number {
    if (!this.nodesData) return -1;
    
    for (let i = 0; i < this.nodesData.length; i++) {
      const node = this.nodesData.get(i);
      if (node && node.id === nodeId) {
        return i;
      }
    }
    
    return -1;
  }
  
  // Find the index of an edge in the edges array
  private findEdgeIndex(edgeId: string): number {
    if (!this.edgesData) return -1;
    
    for (let i = 0; i < this.edgesData.length; i++) {
      const edge = this.edgesData.get(i);
      if (edge && edge.id === edgeId) {
        return i;
      }
    }
    
    return -1;
  }
  
  // Subscribe to changes in the Yjs document
  private subscribeToChanges(): void {
    if (!this.ydoc || !this.flowchartData) return;
    
    this.flowchartData.observe(() => {
      // Flowchart data has changed
      console.log('Flowchart data changed in Yjs document');
      
      // Notify subscribers
      this.notifyFlowchartUpdated();
      
      // Send update to peers
      const data = this.getFlowchartData();
      if (data) {
        p2pService.sendFlowchartUpdate(data);
      }
    });
  }
  
  // Notify subscribers that the flowchart has been updated
  private notifyFlowchartUpdated(): void {
    if (this.flowchartChangedCallback) {
      this.flowchartChangedCallback();
    }
  }
  
  // Callback for flowchart changes
  private flowchartChangedCallback: (() => void) | null = null;
  
  // Register a callback for flowchart changes
  public onFlowchartChanged(callback: () => void): void {
    this.flowchartChangedCallback = callback;
  }
  
  // Update cursor position
  public updateCursorPosition(x: number, y: number): void {
    // Update in Redux store
    store.dispatch({
      type: 'collaboration/updateLocalCursor',
      payload: { x, y }
    });
    
    // Send to peers
    p2pService.sendCursorPosition(x, y);
  }
  
  /**
   * Update the flowchart with new data
   * @param data The flowchart data to update
   */
  public updateFlowchart(data: any): void {
    if (!this.ydoc) return;
    
    console.log('Updating flowchart in Yjs:', data);
    
    this.ydoc.transact(() => {
      // Update properties if provided
      if (data.properties && this.flowchartData) {
        this.flowchartData.set('properties', data.properties);
      }
      
      // Update nodes if provided
      if (Array.isArray(data.nodes) && this.nodesData) {
        // Clear existing nodes
        this.nodesData.delete(0, this.nodesData.length);
        
        // Add new nodes
        data.nodes.forEach((node: any) => {
          this.nodesData?.push([node]);
        });
        
        // Also update in flowchart map
        if (this.flowchartData) {
          this.flowchartData.set('nodes', data.nodes);
        }
      }
      
      // Update edges if provided
      if (Array.isArray(data.edges) && this.edgesData) {
        // Clear existing edges
        this.edgesData.delete(0, this.edgesData.length);
        
        // Add new edges
        data.edges.forEach((edge: any) => {
          this.edgesData?.push([edge]);
        });
        
        // Also update in flowchart map
        if (this.flowchartData) {
          this.flowchartData.set('edges', data.edges);
        }
      }
    });
    
    // Notify subscribers
    this.notifyFlowchartUpdated();
    
    // Share with peers via P2P
    p2pService.sendFlowchartUpdate({
      initialData: {
        nodes: data.nodes,
        edges: data.edges
      }
    });
  }
  
  // Get the current flowchart data
  public getFlowchartData(): any {
    if (!this.flowchartData) return null;
    
    return {
      nodes: this.flowchartData.get('nodes') || [],
      edges: this.flowchartData.get('edges') || []
    };
  }
  
  // Generate a random color for user awareness
  private getRandomColor(): string {
    const colors = ['#FF6B6B', '#48DBFB', '#1DD1A1', '#FFC048', '#9C88FF', '#F368E0', '#FF9F43', '#00D2D3'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Check if the service is initialized
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  // Clean up the service
  public cleanup(): void {
    try {
      // If we're not initialized, don't need to clean up
      if (!this.initialized) {
        return;
      }
      
      console.log('Cleaning up YjsService...');
      
      // Clean up the Yjs document
      if (this.ydoc) {
        this.ydoc.destroy();
        this.ydoc = null;
      }
      
      // Clean up the IndexedDB provider
      if (this.indexeddbProvider) {
        this.indexeddbProvider.destroy();
        this.indexeddbProvider = null;
      }
      
      // Reset properties
      this.flowchartData = null;
      this.nodesData = null;
      this.edgesData = null;
      this.documentId = null;
      this.initialized = false;
      this.flowchartChangedCallback = null;
      
      console.log('YjsService cleaned up');
    } catch (error) {
      console.error('Error cleaning up YjsService:', error);
    }
  }
}

// Create a singleton instance
const yjsService = new YjsService();

export default yjsService; 