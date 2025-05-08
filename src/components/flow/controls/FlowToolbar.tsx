import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineTrash, 
  HiOutlineSave, 
  HiOutlineShare, 
  HiOutlineArrowLeft, 
  HiOutlineDocumentDuplicate,
  HiOutlineRefresh,
  HiOutlineViewGrid,
  HiOutlineClipboardList,
  HiOutlineMenuAlt2,
  HiOutlineUsers,
  HiOutlineX,
} from 'react-icons/hi';
import { RootState } from '../../../store';
import { toggleSidebar, togglePropertyPanel } from '../../../store/slices/uiSlice';
import { applyChanges } from '../../../store/slices/flowchartsSlice';
import { FlowChanges } from '../../../types';
import CollaboratorsList from './CollaboratorsList';
import ShareFlowchart from '../../collaboration/ShareFlowchart';
import { p2pService } from '../../../services';

interface FlowToolbarProps {
  flowchartId: string;
}

const FlowToolbar: React.FC<FlowToolbarProps> = ({ flowchartId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const flowchart = useSelector((state: RootState) => 
    state.flowcharts.items[flowchartId]
  );
  
  const selectedElements = useSelector((state: RootState) => 
    state.ui.selectedElements
  );
  
  const isConnected = useSelector((state: RootState) => 
    state.collaboration.isConnected
  );
  
  const activeFlowchartKey = useSelector((state: RootState) =>
    state.collaboration.activeFlowchartKey
  );
  
  const hasSelection = selectedElements.nodes.length > 0 || selectedElements.edges.length > 0;
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const [collaboratorsListOpen, setCollaboratorsListOpen] = useState(false);
  const [flowchartKey, setFlowchartKey] = useState<string | null>(null);
  
  // Check if this is a shared flowchart (ID starts with 'shared-')
  const isSharedFlowchart = flowchartId.startsWith('shared-');
  
  // When the active flowchart key changes in Redux, update our local state
  useEffect(() => {
    if (activeFlowchartKey) {
      setFlowchartKey(activeFlowchartKey);
    }
  }, [activeFlowchartKey]);
  
  // For shared flowcharts, ensure we have the key on component mount
  useEffect(() => {
    if (isSharedFlowchart && !flowchartKey) {
      // Check if we already have a key for this flowchart
      const existingKey = p2pService.getFlowchartKey(flowchartId);
      if (existingKey) {
        setFlowchartKey(existingKey);
      }
    }
  }, [flowchartId, isSharedFlowchart, flowchartKey]);
  
  // Actions
  const handleGoBack = () => {
    navigate('/dashboard');
  };
  
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };
  
  const handleToggleProperties = () => {
    dispatch(togglePropertyPanel());
  };
  
  const handleDelete = () => {
    if (!hasSelection) return;
    
    // Create changes object for the flowcharts reducer
    const changes: FlowChanges = {
      nodeChanges: selectedElements.nodes.map(nodeId => ({
        type: 'remove',
        id: nodeId,
      })),
      edgeChanges: selectedElements.edges.map(edgeId => ({
        type: 'remove',
        id: edgeId,
      })),
    };
    
    // Dispatch the changes to delete selected elements
    dispatch(applyChanges({ 
      id: flowchartId, 
      changes, 
      message: 'Deleted selected elements' 
    }));
    
    // Log deletion for debugging
    console.log('Deleted elements:', selectedElements);
  };
  
  const handleSave = () => {
    // In a real implementation, this would trigger a save to Hypercore or local storage
    console.log('Save flowchart', flowchartId);
    alert(`Flowchart "${flowchart?.name}" saved!`);
  };
  
  const handleShare = () => {
    setSharingModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setSharingModalOpen(false);
  };
  
  const handleToggleCollaborators = () => {
    setCollaboratorsListOpen(!collaboratorsListOpen);
  };
  
  const handleAutoLayout = () => {
    // In a real implementation, this would call a layout algorithm
    console.log('Auto-layout flowchart', flowchartId);
    alert('Auto-layout applied!');
  };
  
  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            title={t('toggle_sidebar')}
          >
            <HiOutlineMenuAlt2 className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleGoBack}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            title={t('go_back')}
          >
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          
          <h1 className="text-lg font-medium text-gray-900 dark:text-white ml-2">
            {flowchart?.name || t('flowchart')}
          </h1>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={handleAutoLayout}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            title={t('auto_layout')}
          >
            <HiOutlineViewGrid className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => console.log('Connect to task')}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            title={t('connect_to_task')}
          >
            <HiOutlineClipboardList className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleToggleProperties}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            title={t('toggle_properties')}
          >
            <HiOutlineDocumentDuplicate className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleToggleCollaborators}
            className={`p-2 rounded-md ${
              collaboratorsListOpen
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={t('show_collaborators')}
          >
            <HiOutlineUsers className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleDelete}
            disabled={!hasSelection}
            className={`p-2 rounded-md ${
              hasSelection
                ? 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            title={t('delete_selected')}
          >
            <HiOutlineTrash className="h-5 w-5" />
          </button>
          
          <div className="h-6 border-l border-gray-200 dark:border-gray-700 mx-1"></div>
          
          <button
            onClick={handleSave}
            className="p-2 rounded-md text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20"
            title={t('save')}
          >
            <HiOutlineSave className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleShare}
            className="p-2 rounded-md text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900 dark:hover:bg-opacity-20"
            title={t('share')}
          >
            <HiOutlineShare className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Collaborators List */}
      {collaboratorsListOpen && (
        <div className="absolute top-14 right-4 z-10">
          <CollaboratorsList displayMode="inline" onClose={() => setCollaboratorsListOpen(false)} />
        </div>
      )}
      
      {/* Sharing Modal */}
      {sharingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t('share_flowchart')}</h2>
              <button 
                onClick={handleCloseModal}
                className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>
            
            <ShareFlowchart flowchartId={flowchartId} />
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlowToolbar; 