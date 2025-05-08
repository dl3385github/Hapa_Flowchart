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
  private p2pInitialized: boolean = false;
  private flowchartChangedCallback: (() => void) | null = null;

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

      // Set up persistence with IndexedDB for offline capabilities
      try {
        if (!this.indexeddbProvider) {
          this.indexeddbProvider = new IndexeddbPersistence(`hapa-flowchart-${documentId}`, this.ydoc);
          console.log(`Created IndexedDB persistence for document: ${documentId}`);
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
      } catch (error) {
        console.error('Error setting up IndexedDB persistence:', error);
        // Continue without IndexedDB - this is non-fatal
      }

      // Subscribe to document changes
      this.subscribeToChanges();

      // Initialize P2P connection - do this after initial data is loaded
      await this.initializeP2PConnection(documentId);

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

  // Initialize P2P connection
  private async initializeP2PConnection(documentId: string): Promise<void> {
    try {
      // If P2P is already initialized, skip to avoid cyclic initialization
      if (this.p2pInitialized) {
        console.log('P2P connection already initialized, skipping');
        return;
      }
      
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
          console.log('Received flowchart update from P2P:', data.type || 'update');
          this.applyRemoteChanges(data);
        }
      });
      
      // Mark as initialized to prevent cyclic calls
      this.p2pInitialized = true;
      
      // Send initial flowchart data if we have it
      this.shareInitialData();
      
      console.log('P2P connection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize P2P connection:', error);
      
      // Only retry if we haven't exceeded the max attempts
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.connectionAttempts++;
        console.log(`Retrying connection (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.initializeP2PConnection(documentId);
      } else {
        this.p2pInitialized = false;
        throw error;
      }
    }
  }

  // Share initial data with peers
  private shareInitialData(): void {
    // Don't send empty data
    const currentData = this.getFlowchartData();
    if (!currentData || (!currentData.nodes?.length && !currentData.edges?.length)) {
      console.log('No initial flowchart data to share');
      return;
    }
    
    // Use a timeout to ensure the P2P connection is established
    setTimeout(() => {
      console.log('Sharing initial flowchart data:', {
        nodesCount: currentData.nodes?.length || 0,
        edgesCount: currentData.edges?.length || 0
      });
      
      p2pService.sendFlowchartUpdate({
        type: 'initialData',
        initialData: {
          nodes: currentData.nodes,
          edges: currentData.edges
        }
      });
    }, 1000);
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
    
    // Special case for handling requestUpdate - send our current state
    if (data.requestUpdate) {
      console.log('Received request for current flowchart data');
      this.shareInitialData();
      return;
    }
    
    console.log('Applying remote changes to Yjs doc:', data.type || 'unknown');
    
    // Handle initial data sync
    if (data.type === 'initialData' || data.initialData) {
      console.log('Received initial flowchart data');
      
      // Only apply if we have data to apply
      if (!data.initialData?.nodes?.length && !data.initialData?.edges?.length) {
        console.log('Initial data is empty, ignoring');
        return;
      }
      
      try {
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
        
        console.log('Successfully applied initial data');
        
        // Notify subscribers
        this.notifyFlowchartUpdated();
      } catch (error) {
        console.error('Error applying initial data:', error);
      }
      return;
    }
    
    // Handle node operations (move, delete, add)
    if (data.nodeOperation) {
      const op = data.nodeOperation;
      console.log('Applying node operation:', op.type);
      
      try {
        // Get the current nodes from the document
        const nodes = this.getFlowchartData()?.nodes || [];
        
        if (op.type === 'move') {
          // Update the position of the node
          const updatedNodes = nodes.map((node: {id: string; position: {x: number; y: number}; [key: string]: any}) => {
            if (node.id === op.id) {
              return {
                ...node,
                position: op.position
              };
            }
            return node;
          });
          
          // Update the document with the new nodes
          this.updateNodesData(updatedNodes);
        } else if (op.type === 'add') {
          // Add a new node
          const updatedNodes = [...nodes, op.node];
          this.updateNodesData(updatedNodes);
        } else if (op.type === 'delete') {
          // Remove a node
          const updatedNodes = nodes.filter((node: {id: string; [key: string]: any}) => node.id !== op.id);
          this.updateNodesData(updatedNodes);
        } else if (op.type === 'update') {
          // Update a node's properties
          const updatedNodes = nodes.map((node: {id: string; [key: string]: any}) => {
            if (node.id === op.id) {
              return {
                ...node,
                ...op.properties
              };
            }
            return node;
          });
          this.updateNodesData(updatedNodes);
        }
        
        // Notify subscribers
        this.notifyFlowchartUpdated();
      } catch (error) {
        console.error('Error applying node operation:', error);
      }
      return;
    }
    
    // Handle edge operations (add, delete, update)
    if (data.edgeOperation) {
      const op = data.edgeOperation;
      console.log('Applying edge operation:', op.type);
      
      try {
        // Get the current edges from the document
        const edges = this.getFlowchartData()?.edges || [];
        
        if (op.type === 'add') {
          // Add a new edge
          const updatedEdges = [...edges, op.edge];
          this.updateEdgesData(updatedEdges);
        } else if (op.type === 'delete') {
          // Remove an edge
          const updatedEdges = edges.filter((edge: {id: string; [key: string]: any}) => edge.id !== op.id);
          this.updateEdgesData(updatedEdges);
        } else if (op.type === 'update') {
          // Update an edge's properties
          const updatedEdges = edges.map((edge: {id: string; [key: string]: any}) => {
            if (edge.id === op.id) {
              return {
                ...edge,
                ...op.properties
              };
            }
            return edge;
          });
          this.updateEdgesData(updatedEdges);
        }
        
        // Notify subscribers
        this.notifyFlowchartUpdated();
      } catch (error) {
        console.error('Error applying edge operation:', error);
      }
      return;
    }
    
    // Handle complete flowchart update
    if (data.nodes || data.edges) {
      console.log('Applying complete flowchart update');
      
      try {
        // Update nodes if present
        if (Array.isArray(data.nodes)) {
          this.updateNodesData(data.nodes);
        }
        
        // Update edges if present
        if (Array.isArray(data.edges)) {
          this.updateEdgesData(data.edges);
        }
        
        // Notify subscribers
        this.notifyFlowchartUpdated();
      } catch (error) {
        console.error('Error applying complete flowchart update:', error);
      }
    }
  }
  
  // Update the nodes data in the Yjs document
  private updateNodesData(nodes: Array<{id: string; type: string; position: {x: number; y: number}; [key: string]: any}>): void {
    if (!this.ydoc || !this.nodesData || !this.flowchartData) return;
    
    this.ydoc.transact(() => {
      // Clear existing nodes
      this.nodesData!.delete(0, this.nodesData!.length);
      
      // Add new nodes
      nodes.forEach(node => {
        this.nodesData!.push([node]);
      });
      
      // Update in flowchart map
      this.flowchartData!.set('nodes', nodes);
    });
  }
  
  // Update the edges data in the Yjs document
  private updateEdgesData(edges: Array<{id: string; source: string; target: string; [key: string]: any}>): void {
    if (!this.ydoc || !this.edgesData || !this.flowchartData) return;
    
    this.ydoc.transact(() => {
      // Clear existing edges
      this.edgesData!.delete(0, this.edgesData!.length);
      
      // Add new edges
      edges.forEach(edge => {
        this.edgesData!.push([edge]);
      });
      
      // Update in flowchart map
      this.flowchartData!.set('edges', edges);
    });
  }
  
  // Subscribe to changes in the Yjs document
  private subscribeToChanges(): void {
    if (!this.ydoc || !this.flowchartData) return;
    
    this.flowchartData.observe(() => {
      // Flowchart data has changed
      console.log('Flowchart data changed in Yjs document');
      
      // Notify subscribers
      this.notifyFlowchartUpdated();
      
      // Send update to peers if P2P is initialized
      if (this.p2pInitialized) {
        const data = this.getFlowchartData();
        if (data) {
          p2pService.sendFlowchartUpdate(data);
        }
      }
    });
  }
  
  // Notify subscribers that the flowchart has been updated
  private notifyFlowchartUpdated(): void {
    if (this.flowchartChangedCallback) {
      this.flowchartChangedCallback();
    }
  }
  
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
    
    // Send to peers if P2P is initialized
    if (this.p2pInitialized) {
      p2pService.sendCursorPosition(x, y);
    }
  }
  
  // Update the flowchart
  public updateFlowchart(data: any): void {
    if (!this.ydoc || !this.flowchartData) return;
    
    console.log('Updating flowchart in YjsService:', data.type || 'update');
    
    // Apply changes to the Yjs document
    if (data.nodes || data.edges) {
      // Update nodes if present
      if (Array.isArray(data.nodes)) {
        this.updateNodesData(data.nodes);
      }
      
      // Update edges if present
      if (Array.isArray(data.edges)) {
        this.updateEdgesData(data.edges);
      }
    } else if (data.nodeOperation) {
      // Handle node operations
      const op = data.nodeOperation;
      const nodes = this.getFlowchartData()?.nodes || [];
      
      if (op.type === 'move') {
        const updatedNodes = nodes.map((node: {id: string; position: {x: number; y: number}; [key: string]: any}) => {
          if (node.id === op.id) {
            return {
              ...node,
              position: op.position
            };
          }
          return node;
        });
        this.updateNodesData(updatedNodes);
      } else if (op.type === 'add') {
        const updatedNodes = [...nodes, op.node];
        this.updateNodesData(updatedNodes);
      } else if (op.type === 'delete') {
        const updatedNodes = nodes.filter((node: {id: string; [key: string]: any}) => node.id !== op.id);
        this.updateNodesData(updatedNodes);
      } else if (op.type === 'update') {
        const updatedNodes = nodes.map((node: {id: string; [key: string]: any}) => {
          if (node.id === op.id) {
            return {
              ...node,
              ...op.properties
            };
          }
          return node;
        });
        this.updateNodesData(updatedNodes);
      }
    } else if (data.edgeOperation) {
      // Handle edge operations
      const op = data.edgeOperation;
      const edges = this.getFlowchartData()?.edges || [];
      
      if (op.type === 'add') {
        const updatedEdges = [...edges, op.edge];
        this.updateEdgesData(updatedEdges);
      } else if (op.type === 'delete') {
        const updatedEdges = edges.filter((edge: {id: string; [key: string]: any}) => edge.id !== op.id);
        this.updateEdgesData(updatedEdges);
      } else if (op.type === 'update') {
        const updatedEdges = edges.map((edge: {id: string; [key: string]: any}) => {
          if (edge.id === op.id) {
            return {
              ...edge,
              ...op.properties
            };
          }
          return edge;
        });
        this.updateEdgesData(updatedEdges);
      }
    }
    
    // Send update to peers if P2P is initialized
    if (this.p2pInitialized) {
      p2pService.sendFlowchartUpdate(data);
    }
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
  
  // Check if P2P is initialized
  public isP2PInitialized(): boolean {
    return this.p2pInitialized;
  }
  
  // Clean up the service
  public async cleanup(): Promise<void> {
    try {
      // If we're not initialized, don't need to clean up
      if (!this.initialized) {
        return;
      }
      
      console.log('Cleaning up YjsService...');
      
      // Reset P2P initialization flag first to prevent recursive calls
      const wasP2PInitialized = this.p2pInitialized;
      this.p2pInitialized = false;
      
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