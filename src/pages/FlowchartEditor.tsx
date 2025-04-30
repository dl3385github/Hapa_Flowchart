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
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

import { RootState } from '../store';
import { setActiveFlowchart, updateNodes, updateEdges, applyChanges } from '../store/slices/flowchartsSlice';
import { setSelectedElements, clearSelection } from '../store/slices/uiSlice';
import { updateLocalCursor } from '../store/slices/collaborationSlice';
import { FlowChanges } from '../types';
import { yjsService, webRTCService } from '../services';

// Components
import EditorSidebar from '../components/flow/controls/EditorSidebar';
import PropertyPanel from '../components/flow/controls/PropertyPanel';
import FlowToolbar from '../components/flow/controls/FlowToolbar';
import PeerCursors from '../components/collaboration/PeerCursors';

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
  const { isConnected, activeFlowchartKey } = useSelector((state: RootState) => state.collaboration);
  
  // Track if this is a shared flowchart
  const isSharedFlowchart = id?.startsWith('shared-');
  
  // Local ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState(activeFlowchart?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeFlowchart?.edges || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Set active flowchart when ID changes
  useEffect(() => {
    if (id && flowcharts[id]) {
      dispatch(setActiveFlowchart(id));
    }
  }, [id, flowcharts, dispatch]);
  
  // Initialize Yjs for collaborative editing
  useEffect(() => {
    const initializeYjs = async () => {
      if (id && id.startsWith('shared-') && activeFlowchartKey) {
        if (isInitializing) return;
        
        setIsInitializing(true);
        setInitializationError(null);
        
        try {
          console.log('Initializing Yjs with document ID:', activeFlowchartKey);
          await yjsService.initialize(activeFlowchartKey);
          
          // Subscribe to flowchart changes
          yjsService.onFlowchartChanged(() => {
            const flowchartData = yjsService.getFlowchartData();
            if (flowchartData) {
              console.log('Received flowchart update from Yjs:', flowchartData);
              
              try {
                // Validate nodes before setting them
                const validNodes = Array.isArray(flowchartData.nodes) 
                  ? flowchartData.nodes.filter((node: any) => {
                      return node && 
                        typeof node.id === 'string' && 
                        typeof node.type === 'string' && 
                        node.position && 
                        typeof node.position.x === 'number' && 
                        typeof node.position.y === 'number';
                    })
                  : [];
                
                // Validate edges before setting them
                const validEdges = Array.isArray(flowchartData.edges)
                  ? flowchartData.edges.filter((edge: any) => {
                      return edge && 
                        typeof edge.id === 'string' && 
                        typeof edge.source === 'string' && 
                        typeof edge.target === 'string';
                    })
                  : [];
                  
                console.log('Setting nodes and edges in ReactFlow:', validNodes, validEdges);
                setNodes(validNodes);
                setEdges(validEdges);
              } catch (err) {
                console.error('Error processing flowchart data:', err);
              }
            }
          });
          
          setIsInitializing(false);
        } catch (err) {
          console.error('Failed to initialize Yjs:', err);
          setInitializationError('Failed to initialize collaborative editing');
          setIsInitializing(false);
        }
      }
    };
    
    initializeYjs();
    
    return () => {
      // Cleanup Yjs when component unmounts
      if (id && id.startsWith('shared-')) {
        yjsService.cleanup();
      }
    };
  }, [id, activeFlowchartKey, setNodes, setEdges]);
  
  // Update local nodes/edges when flowchart changes in non-collaborative mode
  useEffect(() => {
    if (activeFlowchart && !isSharedFlowchart) {
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
    }
  }, [activeFlowchart, setNodes, setEdges, isSharedFlowchart]);
  
  // Initialize collaborative flowchart when first loaded
  useEffect(() => {
    const initializeCollaborativeFlowchart = () => {
      if (id && id.startsWith('shared-') && activeFlowchartKey && yjsService.isInitialized() && activeFlowchart) {
        // If this is a shared flowchart and we're the first to create it, initialize with our data
        if (activeFlowchart.nodes.length > 0 || activeFlowchart.edges.length > 0) {
          console.log('Initializing collaborative flowchart with local data');
          
          yjsService.updateFlowchart({
            properties: { id: activeFlowchart.id, name: activeFlowchart.name },
            nodes: activeFlowchart.nodes,
            edges: activeFlowchart.edges
          });
        } else {
          // If we're joining an existing flowchart, request data from peers
          console.log('Requesting collaborative flowchart data from peers');
        }
      }
    };
    
    // One-time initialization when the component mounts
    if (isSharedFlowchart && activeFlowchartKey && activeFlowchart) {
      initializeCollaborativeFlowchart();
    }
  }, [id, activeFlowchartKey, activeFlowchart, isSharedFlowchart]);
  
  // Track mouse movement for cursor sharing
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!reactFlowWrapper.current || !reactFlowInstance || !isConnected) return;
    
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    
    // Update cursor position in Redux
    dispatch(updateLocalCursor({ x: position.x, y: position.y }));
    
    // Broadcast cursor position via Yjs
    yjsService.updateCursorPosition(position.x, position.y);
  }, [reactFlowInstance, isConnected, dispatch]);
  
  // Sync node changes to Redux store and Yjs
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes to local state
      onNodesChange(changes);
      
      // If we have a valid flowchart ID, update Redux
      if (id && changes.length > 0) {
        dispatch(updateNodes({ id, changes }));
        
        // Update collaborative state if connected
        if (id.startsWith('shared-') && isConnected) {
          // Apply changes locally first
          const updatedNodes = [...nodes];
          changes.forEach(change => {
            if (change.type === 'position' && change.position) {
              const nodeIndex = updatedNodes.findIndex(n => n.id === change.id);
              if (nodeIndex !== -1) {
                updatedNodes[nodeIndex] = {
                  ...updatedNodes[nodeIndex],
                  position: change.position
                };
              }
            }
          });
          
          // Broadcast changes via Yjs
          yjsService.updateFlowchart({
            nodes: updatedNodes,
            edges
          });
        }
      }
    },
    [id, dispatch, onNodesChange, nodes, edges, isConnected]
  );
  
  // Sync edge changes to Redux store and Yjs
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (id && changes.length > 0) {
        dispatch(updateEdges({ id, changes }));
        
        // Update collaborative state if connected
        if (id.startsWith('shared-') && isConnected) {
          // Apply changes locally first
          const updatedEdges = [...edges];
          
          // Handle edge changes
          changes.forEach(change => {
            if (change.type === 'remove') {
              const edgeIndex = updatedEdges.findIndex(e => e.id === change.id);
              if (edgeIndex !== -1) {
                updatedEdges.splice(edgeIndex, 1);
              }
            }
          });
          
          // Broadcast changes via Yjs
          yjsService.updateFlowchart({
            nodes,
            edges: updatedEdges
          });
        }
      }
    },
    [id, dispatch, onEdgesChange, nodes, edges, isConnected]
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
        
        // Update collaborative state if connected
        if (id.startsWith('shared-') && isConnected) {
          const updatedEdges = [...edges, newEdge];
          yjsService.updateFlowchart({
            nodes,
            edges: updatedEdges
          });
        }
      }
    },
    [id, dispatch, nodes, edges, isConnected]
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
        
        // Update collaborative state if connected
        if (id.startsWith('shared-') && isConnected) {
          const updatedNodes = [...nodes, newNode];
          yjsService.updateFlowchart({
            nodes: updatedNodes,
            edges
          });
        }
      } catch (error) {
        console.error('Error processing drop event:', error);
      }
    },
    [id, dispatch, reactFlowInstance, nodes, edges, isConnected]
  );

  // Handle node property changes
  const handleNodeChange = useCallback((nodeId: string, data: any) => {
    // Implementation for property panel
    console.log('Node property changed:', nodeId, data);
  }, []);

  // Handle edge property changes
  const handleEdgeChange = useCallback((edgeId: string, data: any) => {
    // Implementation for property panel
    console.log('Edge property changed:', edgeId, data);
  }, []);

  // Render loading state
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('initializing_collaboration')}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (initializationError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block rounded-full h-12 w-12 bg-red-100 text-red-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="mt-4 text-red-600 dark:text-red-400">{initializationError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!id) {
    return <div>No flowchart ID provided</div>;
  }
  
  if (!activeFlowchart && !isSharedFlowchart) {
    return <div>Loading flowchart...</div>;
  }
  
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <EditorSidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <FlowToolbar flowchartId={id || ''} />
        
        <div className="flex-1 relative" ref={reactFlowWrapper} onMouseMove={handleMouseMove}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onSelectionChange={handleSelectionChange}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineType={ConnectionLineType.Straight}
            snapToGrid={snapToGrid}
            snapGrid={[gridSize, gridSize]}
            deleteKeyCode={['Backspace', 'Delete']}
            multiSelectionKeyCode={['Control', 'Meta']}
            fitView
          >
            <Background 
              variant={BackgroundVariant.Dots}
              gap={gridSize} 
              size={1}
              color="#aaa"
            />
            <Controls />
            <MiniMap
              nodeStrokeColor={(node) => {
                return '#ddd';
              }}
              nodeColor={(node) => {
                return node.data.color || '#eee';
              }}
              nodeBorderRadius={3}
            />
            <Panel position="top-right">
              {isConnected && (
                <div className="bg-indigo-600 text-white px-3 py-1 rounded-md shadow-md">
                  {t('collaborating_now')}
                </div>
              )}
            </Panel>
            
            {/* Display peer cursors */}
            {isConnected && <PeerCursors />}
          </ReactFlow>
        </div>
      </div>
      
      {propertyPanelOpen && (
        <PropertyPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onNodeChange={handleNodeChange}
          onEdgeChange={handleEdgeChange}
        />
      )}
    </div>
  );
};

export default FlowchartEditor; 