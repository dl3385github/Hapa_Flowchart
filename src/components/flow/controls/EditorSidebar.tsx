import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { HiOutlineX, HiOutlinePlusCircle } from 'react-icons/hi';
import { setSidebarOpen } from '../../../store/slices/uiSlice';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';
import { applyChanges } from '../../../store/slices/flowchartsSlice';

// Define the node types that can be dragged into the flow editor
const nodeTypes = [
  {
    type: 'processNode',
    label: 'process',
    description: 'process_description',
    icon: '⬜️',
    data: { label: 'Process' },
  },
  {
    type: 'decisionNode',
    label: 'decision',
    description: 'decision_description',
    icon: '◇',
    data: { label: 'Decision' },
  },
  {
    type: 'startEndNode',
    label: 'start_end',
    description: 'start_end_description',
    icon: '◯',
    data: { label: 'Start/End', nodeType: 'terminal' },
  },
  {
    type: 'taskNode',
    label: 'task',
    description: 'task_description',
    icon: '📋',
    data: { label: 'Task' },
  },
  {
    type: 'dataNode',
    label: 'data',
    description: 'data_description',
    icon: '🗄️',
    data: { label: 'Data' },
  },
];

const EditorSidebar: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  
  const onDragStart = useCallback((event: React.DragEvent, nodeType: string, nodeData: any) => {
    // Set data for the drag operation
    const data = JSON.stringify({
      type: nodeType,
      data: {
        ...nodeData,
        label: t(nodeData.label) || nodeData.label,
      },
    });
    
    console.log('Starting drag operation with data:', data);
    
    event.dataTransfer.setData('application/reactflow', data);
    
    // This is needed for Firefox
    event.dataTransfer.effectAllowed = 'move';
  }, [t]);
  
  const handleAddNode = useCallback((nodeType: string, nodeData: any) => {
    if (!id) return;
    
    // Create a new node at the center of the viewport
    const newNode = {
      id: `${nodeType}_${uuidv4()}`,
      type: nodeType,
      position: { x: 100, y: 100 }, // Default position
      data: {
        ...nodeData,
        label: t(nodeData.label) || nodeData.label,
      },
    };
    
    // Update Redux state with the new node
    dispatch(
      applyChanges({
        id,
        changes: {
          nodeChanges: [
            {
              type: 'add',
              item: newNode,
            },
          ],
          edgeChanges: [],
        },
      })
    );
  }, [id, dispatch, t]);
  
  const closeSidebar = () => {
    dispatch(setSidebarOpen(false));
  };
  
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          {t('node_palette')}
        </h2>
        <button
          onClick={closeSidebar}
          className="md:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <HiOutlineX className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('drag_nodes_instruction')}
        </p>
        
        <div className="space-y-3">
          {nodeTypes.map((node) => (
            <div
              key={node.type}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 cursor-grab hover:shadow-md transition-shadow relative group"
              draggable
              onDragStart={(event) => onDragStart(event, node.type, node.data)}
              onClick={() => handleAddNode(node.type, node.data)}
            >
              <div className="flex items-center">
                <span className="text-xl mr-3">{node.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t(node.label)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t(node.description)}
                  </div>
                </div>
                <HiOutlinePlusCircle className="h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {t('tips')}
        </h3>
        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-2 list-disc pl-4">
          <li>{t('tip_drag_nodes')}</li>
          <li>{t('tip_connect_nodes')}</li>
          <li>{t('tip_select_multiple')}</li>
          <li>{t('tip_delete_selection')}</li>
        </ul>
      </div>
    </div>
  );
};

export default EditorSidebar; 