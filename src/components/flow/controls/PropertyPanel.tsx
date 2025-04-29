import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { HiOutlineX } from 'react-icons/hi';
import { Node, Edge } from 'reactflow';
import { setPropertyPanelOpen } from '../../../store/slices/uiSlice';

interface PropertyPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onNodeChange: (nodeId: string, data: any) => void;
  onEdgeChange: (edgeId: string, data: any) => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedNode,
  selectedEdge,
  onNodeChange,
  onEdgeChange,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const closePanel = () => {
    dispatch(setPropertyPanelOpen(false));
  };
  
  // Generate fields based on the selected element type
  const renderPropertyFields = () => {
    if (selectedNode) {
      return renderNodeProperties(selectedNode);
    }
    
    if (selectedEdge) {
      return renderEdgeProperties(selectedEdge);
    }
    
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        {t('select_element_to_edit')}
      </div>
    );
  };
  
  // Handle updating node properties
  const handleNodePropertyChange = (key: string, value: any) => {
    if (!selectedNode) return;
    
    const updatedData = {
      ...selectedNode.data,
      [key]: value,
    };
    
    onNodeChange(selectedNode.id, updatedData);
  };
  
  // Handle updating edge properties
  const handleEdgePropertyChange = (key: string, value: any) => {
    if (!selectedEdge) return;
    
    const updatedData = {
      ...selectedEdge.data,
      [key]: value,
    };
    
    onEdgeChange(selectedEdge.id, updatedData);
  };
  
  // Render properties for nodes based on node type
  const renderNodeProperties = (node: Node) => {
    const { type, data } = node;
    
    return (
      <div className="space-y-4">
        {/* Common fields for all nodes */}
        <div className="form-group">
          <label htmlFor="label" className="form-label">{t('label')}</label>
          <input
            id="label"
            type="text"
            value={data.label || ''}
            onChange={(e) => handleNodePropertyChange('label', e.target.value)}
            className="form-input"
          />
        </div>
        
        {/* Description field for most nodes */}
        {type !== 'startEndNode' && (
          <div className="form-group">
            <label htmlFor="description" className="form-label">{t('description')}</label>
            <textarea
              id="description"
              value={data.description || ''}
              onChange={(e) => handleNodePropertyChange('description', e.target.value)}
              className="form-input"
              rows={3}
            />
          </div>
        )}
        
        {/* Specific fields based on node type */}
        {type === 'taskNode' && (
          <div className="form-group">
            <label htmlFor="taskId" className="form-label">{t('task_id')}</label>
            <input
              id="taskId"
              type="text"
              value={data.taskId || ''}
              onChange={(e) => handleNodePropertyChange('taskId', e.target.value)}
              className="form-input"
              placeholder={t('enter_task_id')}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('task_id_description')}
            </p>
          </div>
        )}
        
        {type === 'decisionNode' && (
          <>
            <div className="form-group">
              <div className="flex items-center">
                <input
                  id="showLabels"
                  type="checkbox"
                  checked={data.showLabels || false}
                  onChange={(e) => handleNodePropertyChange('showLabels', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showLabels" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {t('show_labels')}
                </label>
              </div>
            </div>
            
            {data.showLabels && (
              <>
                <div className="form-group">
                  <label htmlFor="rightLabel" className="form-label">{t('right_label')}</label>
                  <input
                    id="rightLabel"
                    type="text"
                    value={data.rightLabel || 'Yes'}
                    onChange={(e) => handleNodePropertyChange('rightLabel', e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="bottomLabel" className="form-label">{t('bottom_label')}</label>
                  <input
                    id="bottomLabel"
                    type="text"
                    value={data.bottomLabel || 'No'}
                    onChange={(e) => handleNodePropertyChange('bottomLabel', e.target.value)}
                    className="form-input"
                  />
                </div>
              </>
            )}
          </>
        )}
        
        {type === 'startEndNode' && (
          <div className="form-group">
            <label htmlFor="nodeType" className="form-label">{t('node_type')}</label>
            <select
              id="nodeType"
              value={data.nodeType || 'terminal'}
              onChange={(e) => handleNodePropertyChange('nodeType', e.target.value)}
              className="form-input"
            >
              <option value="start">{t('start')}</option>
              <option value="end">{t('end')}</option>
              <option value="terminal">{t('terminal')}</option>
            </select>
          </div>
        )}
        
        {type === 'dataNode' && (
          <div className="form-group">
            <label htmlFor="dataType" className="form-label">{t('data_type')}</label>
            <input
              id="dataType"
              type="text"
              value={data.dataType || ''}
              onChange={(e) => handleNodePropertyChange('dataType', e.target.value)}
              className="form-input"
              placeholder={t('enter_data_type')}
            />
          </div>
        )}
      </div>
    );
  };
  
  // Render properties for edges
  const renderEdgeProperties = (edge: Edge) => {
    const data = edge.data || {};
    
    return (
      <div className="space-y-4">
        <div className="form-group">
          <label htmlFor="edgeLabel" className="form-label">{t('label')}</label>
          <input
            id="edgeLabel"
            type="text"
            value={data.label || ''}
            onChange={(e) => handleEdgePropertyChange('label', e.target.value)}
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="edgeType" className="form-label">{t('edge_type')}</label>
          <select
            id="edgeType"
            value={data.edgeType || 'default'}
            onChange={(e) => handleEdgePropertyChange('edgeType', e.target.value)}
            className="form-input"
          >
            <option value="default">{t('default')}</option>
            <option value="bezier">{t('curved')}</option>
          </select>
        </div>
        
        <div className="form-group">
          <div className="flex items-center">
            <input
              id="animated"
              type="checkbox"
              checked={edge.animated || false}
              onChange={(e) => handleEdgePropertyChange('animated', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="animated" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              {t('animated')}
            </label>
          </div>
        </div>
        
        {edge.type === 'conditional' && (
          <div className="form-group">
            <label htmlFor="condition" className="form-label">{t('condition')}</label>
            <input
              id="condition"
              type="text"
              value={data.condition || ''}
              onChange={(e) => handleEdgePropertyChange('condition', e.target.value)}
              className="form-input"
              placeholder={t('condition_placeholder')}
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          {selectedNode 
            ? t('node_properties') 
            : selectedEdge 
              ? t('edge_properties') 
              : t('properties')}
        </h2>
        <button
          onClick={closePanel}
          className="p-1 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <HiOutlineX className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {renderPropertyFields()}
      </div>
    </div>
  );
};

export default PropertyPanel; 