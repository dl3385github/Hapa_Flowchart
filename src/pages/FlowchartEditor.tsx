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
import TaskNode from '../components/flow/nodes/TaskNode';
import ProcessNode from '../components/flow/nodes/ProcessNode';
import DecisionNode from '../components/flow/nodes/DecisionNode';
import StartEndNode from '../components/flow/nodes/StartEndNode';
import DataNode from '../components/flow/nodes/DataNode';

// Edge types
import CustomEdge from '../components/flow/edges/CustomEdge';
import ConditionalEdge from '../components/flow/edges/ConditionalEdge';

// Define custom node and edge types
const nodeTypes = {
  taskNode: TaskNode,
  processNode: ProcessNode,
  decisionNode: DecisionNode,
  startEndNode: StartEndNode,
  dataNode: DataNode,
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
      setNodes(activeFlowchart.nodes);
      setEdges(activeFlowchart.edges);
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
    ({ nodes, edges }) => {
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
      if (id) {
        const newEdge = {
          ...connection,
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
        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [id, dispatch, setEdges]
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
      
      if (!reactFlowInstance || !reactFlowWrapper.current) {
        console.error('ReactFlow instance or wrapper is not available');
        return;
      }
      
      // Get the position of the drop relative to the ReactFlow canvas
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      console.log('ReactFlow bounds:', reactFlowBounds);
      
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      console.log('Projected position:', position);
      
      try {
        // Parse the data transfer to get node type and data
        const rawData = event.dataTransfer.getData('application/reactflow');
        console.log('Dropped data:', rawData);
        
        if (!rawData) {
          console.error('No data found in drop event');
          return;
        }
        
        const nodeData = JSON.parse(rawData);
        console.log('Parsed node data:', nodeData);
        
        // Create a new node
        const newNode: Node = {
          id: `${nodeData.type}_${uuidv4()}`,
          type: nodeData.type,
          position,
          data: nodeData.data,
        };
        console.log('Creating new node:', newNode);
        
        // Update Redux state with the new node
        if (id) {
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
          setNodes((nds) => [...nds, newNode]);
          console.log('Node added successfully');
        } else {
          console.error('No flowchart ID available');
        }
      } catch (error) {
        console.error('Error adding node:', error);
      }
    },
    [id, reactFlowInstance, dispatch, setNodes]
  );
  
  // Add onInit handler with logging
  const onInit = useCallback((instance: ReactFlowInstance) => {
    console.log('ReactFlow initialized', instance);
    setReactFlowInstance(instance);
  }, []);
  
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
      
      <div className="flex-1 flex h-full overflow-hidden">
        <div className="flex-shrink-0">
          <EditorSidebar />
        </div>
        
        <div className="flex-1 h-full w-full relative" ref={reactFlowWrapper}>
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