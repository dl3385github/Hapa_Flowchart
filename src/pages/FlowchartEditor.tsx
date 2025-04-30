import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Panel,
  ConnectionLineType,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

import { RootState } from '../store';
import { setActiveFlowchart, updateNodes, updateEdges, applyChanges } from '../store/slices/flowchartsSlice';
import { setSelectedElements } from '../store/slices/uiSlice';
import { FlowChanges } from '../types';

// Components
import EditorSidebar from '../components/flow/controls/EditorSidebar';
import PropertyPanel from '../components/flow/controls/PropertyPanel';
import FlowToolbar from '../components/flow/controls/FlowToolbar';

// Node types
import ProcessNode from '../components/flow/nodes/ProcessNode';
import DecisionNode from '../components/flow/nodes/DecisionNode';
import StartEndNode from '../components/flow/nodes/StartEndNode';
import DataNode from '../components/flow/nodes/DataNode';
import SimpleTestNode from '../components/flow/nodes/SimpleTestNode';

// Edge types
import CustomEdge from '../components/flow/edges/CustomEdge';
import ConditionalEdge from '../components/flow/edges/ConditionalEdge';

// Define custom node and edge types
const nodeTypes = {
  processNode: ProcessNode,
  decisionNode: DecisionNode,
  startEndNode: StartEndNode,
  dataNode: DataNode,
  simpleTestNode: SimpleTestNode,
};

const edgeTypes = {
  custom: CustomEdge,
  conditional: ConditionalEdge,
};

const FlowchartEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');
  
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const flowcharts = useSelector((state: RootState) => state.flowcharts.items);
  const activeFlowchart = id && flowcharts[id] ? flowcharts[id] : null;
  const { snapToGrid, gridSize } = useSelector((state: RootState) => state.settings);
  const { propertyPanelOpen } = useSelector((state: RootState) => state.ui);
  
  // Local ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState(activeFlowchart?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeFlowchart?.edges || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Set active flowchart when ID changes
  useEffect(() => {
    if (id && flowcharts[id]) {
      dispatch(setActiveFlowchart(id));
    }
  }, [id, flowcharts, dispatch]);
  
  // Update local nodes/edges when flowchart changes
  useEffect(() => {
    if (activeFlowchart) {
      console.log('Syncing Redux state to local ReactFlow state:', activeFlowchart.nodes, activeFlowchart.edges);
      
      // Check if nodes have required properties
      const validNodes = activeFlowchart.nodes.filter(node => {
        const hasRequiredProps = node && 
                               typeof node.id === 'string' && 
                               typeof node.type === 'string' && 
                               node.position && 
                               typeof node.position.x === 'number' && 
                               typeof node.position.y === 'number';
        
        if (!hasRequiredProps) {
          console.error('Invalid node found:', node);
        }
        
        // Check if node type is registered
        if (node && node.type && !nodeTypes[node.type as keyof typeof nodeTypes]) {
          console.error(`Node type "${node.type}" is not registered in nodeTypes:`, nodeTypes);
        }
        
        return hasRequiredProps;
      });
      
      console.log('Valid nodes to render:', validNodes);
      
      setNodes(activeFlowchart.nodes);
      setEdges(activeFlowchart.edges);
    } else {
      console.log('Active flowchart not found, clearing local state.');
      setNodes([]);
      setEdges([]);
    }
  }, [activeFlowchart, setNodes, setEdges]);
  
  // Sync node changes to Redux store
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      if (id && changes.length > 0) {
        dispatch(updateNodes({ id, changes }));
      }
    },
    [id, dispatch, onNodesChange]
  );
  
  // Sync edge changes to Redux store
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (id && changes.length > 0) {
        dispatch(updateEdges({ id, changes }));
      }
    },
    [id, dispatch, onEdgesChange]
  );
  
  // Handle selection changes
  const handleSelectionChange = useCallback(
    ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNode(nodes.length === 1 ? nodes[0] : null);
      setSelectedEdge(edges.length === 1 ? edges[0] : null);
      
      // Update UI state with selection
      dispatch(
        setSelectedElements({
          nodes: nodes.map((node: Node) => node.id),
          edges: edges.map((edge: Edge) => edge.id),
        })
      );
    },
    [dispatch]
  );
  
  // Handle edge connections
  const handleConnect = useCallback(
    (connection: Connection) => {
      // Ensure the connection is complete before creating the edge
      if (id && connection.source && connection.target) {
        const newEdge: Edge = {
          id: `edge_${uuidv4()}`, // Generate unique ID with static prefix
          source: connection.source, // Now guaranteed non-null
          target: connection.target, // Now guaranteed non-null
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          type: 'custom',
          animated: false,
          data: {},
        };

        const change: FlowChanges = {
          nodeChanges: [],
          edgeChanges: [
            {
              type: 'add',
              item: newEdge,
            },
          ],
        };

        dispatch(applyChanges({ id, changes: change }));
      }
    },
    [id, dispatch]
  );
  
  // Handle drag over for the ReactFlow area
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    console.log('Dragging over ReactFlow area');
  }, []);
  
  // Handle drop for adding new nodes
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      console.log('Drop event triggered');

      if (!reactFlowInstance || !reactFlowWrapper.current || !id) {
        console.error('ReactFlow instance, wrapper, or flowchart ID is not available');
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      console.log('ReactFlow container bounds:', reactFlowBounds);
      
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      console.log('Projected position:', position);

      try {
        const rawData = event.dataTransfer.getData('application/reactflow');
        console.log('Dropped data:', rawData);
        if (!rawData) {
          console.error('No data found in drop event');
          return;
        }
        
        const nodeData = JSON.parse(rawData);
        console.log('Parsed node data:', nodeData);
        
        // Check if node type is valid and registered
        if (!nodeData.type || !nodeTypes[nodeData.type as keyof typeof nodeTypes]) {
          console.error(`Node type "${nodeData.type}" is not registered in nodeTypes:`, nodeTypes);
          return;
        }
        
        const newNode: Node = {
          id: `${nodeData.type}_${uuidv4()}`,
          type: nodeData.type,
          position,
          data: nodeData.data || { label: 'New Node' },
        };
        console.log('Creating new node:', newNode);

        const change: FlowChanges = {
          nodeChanges: [
            {
              type: 'add',
              item: newNode,
            },
          ],
          edgeChanges: [],
        };

        dispatch(applyChanges({ id, changes: change }));
        console.log('Dispatched applyChanges for new node');
        
        // Also update local state directly (temporarily add this back)
        setNodes((nds) => [...nds, newNode]);
        console.log('Directly updated local nodes state');

      } catch (error) {
        console.error('Error adding node:', error);
      }
    },
    [id, reactFlowInstance, dispatch, setNodes, nodeTypes]
  );
  
  // Add onInit handler with logging
  const onInit = useCallback((instance: ReactFlowInstance) => {
    console.log('ReactFlow initialized', instance);
    
    // Check if our container has proper dimensions
    if (reactFlowWrapper.current) {
      const { width, height } = reactFlowWrapper.current.getBoundingClientRect();
      console.log('ReactFlow container dimensions:', { width, height });
      
      if (width === 0 || height === 0) {
        console.error('ReactFlow container has zero width or height!');
      }
    }
    
    setReactFlowInstance(instance);
    
    // Try to force fit view after a short delay to ensure rendering
    setTimeout(() => {
      instance.fitView({ padding: 0.2 });
      console.log('Forced fitView after initialization');
    }, 100);
    
  }, []);
  
  // Add this function after the other callback functions
  const addDebugNode = useCallback(() => {
    if (!reactFlowInstance || !id) return;
    
    console.log('Creating debug node');
    
    // Get viewport center for positioning
    const viewport = reactFlowInstance.getViewport();
    const position = reactFlowInstance.project({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const newNode: Node = {
      id: `debug_${uuidv4()}`,
      type: 'simpleTestNode', // Use the simple test node
      position,
      data: { label: 'DEBUG NODE' },
    };
    
    console.log('Debug node details:', newNode);
    
    // Update both Redux and local state
    const change: FlowChanges = {
      nodeChanges: [
        {
          type: 'add',
          item: newNode,
        },
      ],
      edgeChanges: [],
    };
    
    dispatch(applyChanges({ id, changes: change }));
    console.log('Dispatched applyChanges for debug node');
    
    // Also update local state directly
    setNodes((nds) => [...nds, newNode]);
    console.log('Directly updated local nodes state with debug node');
    
  }, [id, reactFlowInstance, dispatch, setNodes]);
  
  if (!id) {
    return <div>No flowchart ID provided</div>;
  }
  
  if (!activeFlowchart) {
    return <div>Loading flowchart...</div>;
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <FlowToolbar flowchartId={id} />
      </div>
      
      <div className="flex flex-1 h-full overflow-hidden">
        <div className="flex-shrink-0">
          <EditorSidebar />
        </div>
        
        <div 
          className="flex-1 relative h-full w-full min-h-[500px] border-4 border-purple-500 bg-gray-100" 
          ref={reactFlowWrapper} 
          style={{ height: '100%' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onSelectionChange={handleSelectionChange}
            onConnect={handleConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            snapToGrid={snapToGrid}
            snapGrid={[gridSize, gridSize]}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            attributionPosition="bottom-right"
            style={{ width: '100%', height: '100%' }}
          >
            <Background />
            <Controls />
            <MiniMap />
            
            <Panel position="top-right">
              {t('flowchart')}: {activeFlowchart.name}
            </Panel>
          </ReactFlow>
        </div>
        
        {propertyPanelOpen && (
          <div className="flex-shrink-0 w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
            <PropertyPanel 
              selectedNode={selectedNode} 
              selectedEdge={selectedEdge} 
              onNodeChange={() => {}} // Implement node property changes
              onEdgeChange={() => {}} // Implement edge property changes
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowchartEditor; 