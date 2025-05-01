import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { store } from '../store';
import { 
  createFlowchart, 
  updateNodes, 
  updateEdges,
  importFlowchart,
  deleteFlowchart,
  setActiveFlowchart,
  applyChanges
} from '../store/slices/flowchartsSlice';
import { NodeChange, EdgeChange } from 'reactflow';
import p2pService from './P2PService';

class YjsService {
  private docs: Map<string, Y.Doc> = new Map();
  private indexeddbProviders: Map<string, IndexeddbPersistence> = new Map();
  private activeFlowchartId: string | null = null;
  private initialized: boolean = false;
  
  // Initialize the service
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Subscribe to Redux store changes
    store.subscribe(() => {
      // Process changes from Redux store to Y.js
      this.processReduxChanges();
    });
    
    console.log('YjsService initialized');
    this.initialized = true;
  }
  
  // Load or create a document for a flowchart
  public async getFlowchartDoc(flowchartId: string): Promise<Y.Doc> {
    if (this.docs.has(flowchartId)) {
      return this.docs.get(flowchartId)!;
    }
    
    // Create a new Y.js document
    const doc = new Y.Doc();
    
    // Store the document
    this.docs.set(flowchartId, doc);
    
    // Create indexeddb persistence
    const indexeddbProvider = new IndexeddbPersistence(`flowchart-${flowchartId}`, doc);
    this.indexeddbProviders.set(flowchartId, indexeddbProvider);
    
    // Initialize the document with empty data if it's new
    indexeddbProvider.on('synced', () => {
      console.log(`IndexedDB provider synced for flowchart ${flowchartId}`);
      
      // Get the shared data
      const nodes = doc.getArray('nodes');
      const edges = doc.getArray('edges');
      
      // Check if we have data in the document
      if (nodes.length === 0 && edges.length === 0) {
        console.log('No data in IndexedDB, initializing with empty arrays');
        
        // Nothing to do, the document is already empty
      } else {
        console.log(`Loaded ${nodes.length} nodes and ${edges.length} edges from IndexedDB`);
        
        // Update Redux store with the loaded data
        const flowchartData = {
          id: flowchartId,
          name: flowchartId,
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          public: false,
          nodes: Array.from(nodes.toJSON()),
          edges: Array.from(edges.toJSON())
        };
        
        store.dispatch(importFlowchart(flowchartData));
      }
    });
    
    // Set up document change handlers
    this.setupChangeHandlers(doc, flowchartId);
    
    return doc;
  }
  
  // Set the active flowchart
  public async setActiveFlowchart(flowchartId: string): Promise<void> {
    console.log(`Setting active flowchart to ${flowchartId}`);
    
    this.activeFlowchartId = flowchartId;
    
    // Load or create the document
    const doc = await this.getFlowchartDoc(flowchartId);
    
    // Subscribe to document changes from P2PService
    p2pService.onFlowchartUpdate((data) => {
      console.log('Received flowchart update from P2PService:', data);
      this.handleFlowchartUpdate(flowchartId, data);
    });
  }
  
  // Handle flowchart update from P2PService
  private handleFlowchartUpdate(flowchartId: string, data: any): void {
    try {
      if (!this.docs.has(flowchartId)) {
        console.error(`Document for flowchart ${flowchartId} not found`);
        return;
      }
      
      const doc = this.docs.get(flowchartId)!;
      
      // Handle different types of updates
      if (data.nodeOperation) {
        // Handle node operations
        const op = data.nodeOperation;
        
        switch (op.type) {
          case 'add':
            // Add node to Redux store
            const currState = store.getState().flowcharts.items[flowchartId];
            if (currState) {
              store.dispatch(updateNodes({
                id: flowchartId,
                changes: [{ type: 'add', item: op.node } as NodeChange]
              }));
            }
            break;
          case 'update':
            // Update node position in Redux store
            store.dispatch(updateNodes({
              id: flowchartId,
              changes: [{ 
                type: 'position', 
                id: op.node.id, 
                position: op.node.position 
              } as NodeChange]
            }));
            break;
          case 'delete':
            // Delete node in Redux store
            store.dispatch(updateNodes({
              id: flowchartId,
              changes: [{ type: 'remove', id: op.nodeId } as NodeChange]
            }));
            break;
        }
      } else if (data.edgeOperation) {
        // Handle edge operations
        const op = data.edgeOperation;
        
        switch (op.type) {
          case 'add':
            // Add edge to Redux store
            store.dispatch(updateEdges({
              id: flowchartId,
              changes: [{ type: 'add', item: op.edge } as EdgeChange]
            }));
            break;
          case 'delete':
            // Delete edge in Redux store
            store.dispatch(updateEdges({
              id: flowchartId,
              changes: [{ type: 'remove', id: op.edgeId } as EdgeChange]
            }));
            break;
        }
      } else if (data.nodes && data.edges) {
        // Full flowchart update
        // Update the document with the received data
        doc.transact(() => {
          // Get or create shared data structures
          const nodes = doc.getArray('nodes');
          const edges = doc.getArray('edges');
          
          // Clear existing data
          nodes.delete(0, nodes.length);
          edges.delete(0, edges.length);
          
          // Add new nodes
          for (const node of data.nodes) {
            nodes.push([node]);
          }
          
          // Add new edges
          for (const edge of data.edges) {
            edges.push([edge]);
          }
        });
        
        // Update Redux store with full flowchart import
        const flowchartData = {
          id: flowchartId,
          name: flowchartId,
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          public: false,
          nodes: data.nodes,
          edges: data.edges
        };
        
        store.dispatch(importFlowchart(flowchartData));
      }
    } catch (error) {
      console.error('Error handling flowchart update:', error);
    }
  }
  
  // Process changes from Redux store to Y.js
  private processReduxChanges(): void {
    // This could be implemented to sync from Redux to Y.js if needed
  }
  
  // Set up document change handlers
  private setupChangeHandlers(doc: Y.Doc, flowchartId: string): void {
    // Get shared data structures
    const nodes = doc.getArray('nodes');
    const edges = doc.getArray('edges');
    
    // Handle node changes
    nodes.observe(event => {
      // Don't process our own changes
      if (event.transaction.local) return;
      
      console.log('Nodes changed in Y.js document:', event);
      
      // Update Redux store with the new nodes
      const flowchart = store.getState().flowcharts.items[flowchartId];
      if (flowchart) {
        // Create node changes
        const nodeChanges: NodeChange[] = Array.from(nodes.toJSON()).map(node => ({
          type: 'add',
          item: node
        } as NodeChange));
        
        store.dispatch(updateNodes({
          id: flowchartId,
          changes: nodeChanges
        }));
      }
    });
    
    // Handle edge changes
    edges.observe(event => {
      // Don't process our own changes
      if (event.transaction.local) return;
      
      console.log('Edges changed in Y.js document:', event);
      
      // Update Redux store with the new edges
      const flowchart = store.getState().flowcharts.items[flowchartId];
      if (flowchart) {
        // Create edge changes
        const edgeChanges: EdgeChange[] = Array.from(edges.toJSON()).map(edge => ({
          type: 'add',
          item: edge
        } as EdgeChange));
        
        store.dispatch(updateEdges({
          id: flowchartId,
          changes: edgeChanges
        }));
      }
    });
  }
  
  // Update nodes or edges in Y.js document
  public updateFlowchartData(flowchartId: string, data: any): void {
    try {
      if (!this.docs.has(flowchartId)) {
        console.error(`Document for flowchart ${flowchartId} not found`);
        return;
      }
      
      const doc = this.docs.get(flowchartId)!;
      
      doc.transact(() => {
        // Get shared data structures
        const nodes = doc.getArray('nodes');
        const edges = doc.getArray('edges');
        
        // Update nodes if provided
        if (data.nodes) {
          // Clear existing nodes
          nodes.delete(0, nodes.length);
          
          // Add new nodes
          for (const node of data.nodes) {
            nodes.push([node]);
          }
        }
        
        // Update edges if provided
        if (data.edges) {
          // Clear existing edges
          edges.delete(0, edges.length);
          
          // Add new edges
          for (const edge of data.edges) {
            edges.push([edge]);
          }
        }
      });
      
      // Send update via P2PService
      p2pService.sendFlowchartUpdate(data);
    } catch (error) {
      console.error('Error updating flowchart data:', error);
    }
  }
  
  // Handle node operations
  public handleNodeOperation(flowchartId: string, operation: any): void {
    try {
      // Send the operation via P2PService
      p2pService.sendFlowchartUpdate({
        nodeOperation: operation
      });
    } catch (error) {
      console.error('Error handling node operation:', error);
    }
  }
  
  // Handle edge operations
  public handleEdgeOperation(flowchartId: string, operation: any): void {
    try {
      // Send the operation via P2PService
      p2pService.sendFlowchartUpdate({
        edgeOperation: operation
      });
    } catch (error) {
      console.error('Error handling edge operation:', error);
    }
  }
  
  // Clean up resources
  public cleanup(): void {
    // Close all providers
    this.indexeddbProviders.forEach(provider => {
      provider.destroy();
    });
    
    // Clear maps
    this.docs.clear();
    this.indexeddbProviders.clear();
    
    // Reset state
    this.activeFlowchartId = null;
    this.initialized = false;
    
    console.log('YjsService cleaned up');
  }
}

// Create a singleton instance
const yjsService = new YjsService();

export default yjsService; 