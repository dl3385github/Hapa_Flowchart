import React, { useCallback, useEffect, useState } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';

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
        
        <div className="flex-1 h-full">
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