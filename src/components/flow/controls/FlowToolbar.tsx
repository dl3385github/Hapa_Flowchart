import React, { useState } from 'react';
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
} from 'react-icons/hi';
import { RootState } from '../../../store';
import { toggleSidebar, togglePropertyPanel } from '../../../store/slices/uiSlice';
import CollaboratorsList from './CollaboratorsList';

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
  
  const hasSelection = selectedElements.nodes.length > 0 || selectedElements.edges.length > 0;
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const [collaboratorsListOpen, setCollaboratorsListOpen] = useState(false);
  
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
    // In a real implementation, this would dispatch an action to delete selected elements
    console.log('Delete selected elements', selectedElements);
    // dispatch(deleteElements(flowchartId, selectedElements));
  };
  
  const handleSave = () => {
    // In a real implementation, this would trigger a save to Hypercore or local storage
    console.log('Save flowchart', flowchartId);
    alert(`Flowchart "${flowchart?.name}" saved!`);
  };
  
  const handleShare = () => {
    setSharingModalOpen(true);
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
      
      {/* Sharing Modal */}
      {sharingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">{t('share_flowchart')}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('hypercore_key')}
              </label>
              <div className="flex">
                <input
                  type="text"
                  value="abc123def456ghi789jkl012mno345pqr678stu9"
                  readOnly
                  className="form-input rounded-r-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('abc123def456ghi789jkl012mno345pqr678stu9');
                    alert(t('copied_to_clipboard'));
                  }}
                  className="px-3 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <HiOutlineDocumentDuplicate className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('share_key_description')}
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('p2p_status')}
              </label>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t('ready_for_collaboration')}
                </span>
                <button
                  onClick={() => {}}
                  className="ml-auto p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title={t('refresh')}
                >
                  <HiOutlineRefresh className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSharingModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Collaborators List */}
      <CollaboratorsList 
        isOpen={collaboratorsListOpen} 
        onClose={() => setCollaboratorsListOpen(false)} 
      />
    </>
  );
};

export default FlowToolbar; 