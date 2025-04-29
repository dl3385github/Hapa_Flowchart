import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { Flowchart, FlowChanges, Version, LinkedTask } from '../../types';

interface FlowchartsState {
  items: Record<string, Flowchart>;
  activeId: string | null;
  loading: boolean;
  error: string | null;
  versions: Record<string, Version[]>;
  linkedTasks: Record<string, LinkedTask[]>;
}

const initialState: FlowchartsState = {
  items: {},
  activeId: null,
  loading: false,
  error: null,
  versions: {},
  linkedTasks: {},
};

export const flowchartsSlice = createSlice({
  name: 'flowcharts',
  initialState,
  reducers: {
    // Create a new flowchart
    createFlowchart: (state, action: PayloadAction<{ name: string; description?: string }>) => {
      const id = uuidv4();
      const timestamp = new Date().toISOString();
      
      state.items[id] = {
        id,
        name: action.payload.name,
        description: action.payload.description || '',
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
        public: false,
        nodes: [],
        edges: [],
      };
      
      state.activeId = id;
      state.versions[id] = [{
        version: 1,
        timestamp,
        message: 'Initial version',
        changes: {
          nodesAdded: [],
          nodesRemoved: [],
          nodesModified: [],
          edgesAdded: [],
          edgesRemoved: [],
          edgesModified: [],
        },
      }];
    },
    
    // Set active flowchart
    setActiveFlowchart: (state, action: PayloadAction<string>) => {
      state.activeId = action.payload;
    },
    
    // Update flowchart nodes
    updateNodes: (state, action: PayloadAction<{ id: string; changes: NodeChange[] }>) => {
      const { id, changes } = action.payload;
      if (state.items[id]) {
        state.items[id].nodes = applyNodeChanges(changes, state.items[id].nodes);
        state.items[id].updatedAt = new Date().toISOString();
        // Increment version would happen here in a real implementation with version tracking
      }
    },
    
    // Update flowchart edges
    updateEdges: (state, action: PayloadAction<{ id: string; changes: EdgeChange[] }>) => {
      const { id, changes } = action.payload;
      if (state.items[id]) {
        state.items[id].edges = applyEdgeChanges(changes, state.items[id].edges);
        state.items[id].updatedAt = new Date().toISOString();
        // Increment version would happen here in a real implementation with version tracking
      }
    },
    
    // Apply multiple changes (nodes and edges) and create a version
    applyChanges: (state, action: PayloadAction<{ id: string; changes: FlowChanges; message?: string }>) => {
      const { id, changes, message } = action.payload;
      if (state.items[id]) {
        const flowchart = state.items[id];
        
        // Apply changes
        flowchart.nodes = applyNodeChanges(changes.nodeChanges, flowchart.nodes);
        flowchart.edges = applyEdgeChanges(changes.edgeChanges, flowchart.edges);
        
        // Update version
        const newVersion = flowchart.version + 1;
        flowchart.version = newVersion;
        flowchart.updatedAt = new Date().toISOString();
        
        // Track changes for version history
        // This is simplified - a real implementation would track specific changes
        if (!state.versions[id]) {
          state.versions[id] = [];
        }
        
        state.versions[id].push({
          version: newVersion,
          timestamp: new Date().toISOString(),
          message: message || `Changes applied (version ${newVersion})`,
          changes: {
            nodesAdded: changes.nodeChanges
              .filter(change => change.type === 'add')
              .map(change => (change as any).item.id),
            nodesRemoved: changes.nodeChanges
              .filter(change => change.type === 'remove')
              .map(change => change.id),
            nodesModified: changes.nodeChanges
              .filter(change => change.type !== 'add' && change.type !== 'remove')
              .map(change => change.id),
            edgesAdded: changes.edgeChanges
              .filter(change => change.type === 'add')
              .map(change => (change as any).item.id),
            edgesRemoved: changes.edgeChanges
              .filter(change => change.type === 'remove')
              .map(change => change.id),
            edgesModified: changes.edgeChanges
              .filter(change => change.type !== 'add' && change.type !== 'remove')
              .map(change => change.id),
          },
        });
      }
    },
    
    // Link a task to a flowchart node
    linkTask: (state, action: PayloadAction<{ flowchartId: string; nodeId: string; taskId: string }>) => {
      const { flowchartId, nodeId, taskId } = action.payload;
      
      if (!state.linkedTasks[flowchartId]) {
        state.linkedTasks[flowchartId] = [];
      }
      
      // Check if this node already has a task linked
      const existingLinkIndex = state.linkedTasks[flowchartId].findIndex(
        link => link.nodeId === nodeId
      );
      
      if (existingLinkIndex >= 0) {
        // Update existing link
        state.linkedTasks[flowchartId][existingLinkIndex] = {
          taskId,
          nodeId,
          linkedAt: new Date().toISOString(),
        };
      } else {
        // Add new link
        state.linkedTasks[flowchartId].push({
          taskId,
          nodeId,
          linkedAt: new Date().toISOString(),
        });
      }
      
      // Also update the node data if it exists
      if (state.items[flowchartId]) {
        const nodeIndex = state.items[flowchartId].nodes.findIndex(node => node.id === nodeId);
        if (nodeIndex >= 0) {
          const updatedNodes = [...state.items[flowchartId].nodes];
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            data: {
              ...updatedNodes[nodeIndex].data,
              taskId,
            },
          };
          state.items[flowchartId].nodes = updatedNodes;
          state.items[flowchartId].updatedAt = new Date().toISOString();
        }
      }
    },
    
    // Import a flowchart (for loading from file or hypercore)
    importFlowchart: (state, action: PayloadAction<Flowchart>) => {
      const flowchart = action.payload;
      state.items[flowchart.id] = flowchart;
      state.activeId = flowchart.id;
    },
    
    // Delete a flowchart
    deleteFlowchart: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.items[id];
      if (state.activeId === id) {
        state.activeId = Object.keys(state.items)[0] || null;
      }
      delete state.versions[id];
      delete state.linkedTasks[id];
    },
  },
});

export const {
  createFlowchart,
  setActiveFlowchart,
  updateNodes,
  updateEdges,
  applyChanges,
  linkTask,
  importFlowchart,
  deleteFlowchart,
} = flowchartsSlice.actions;

export default flowchartsSlice.reducer; 