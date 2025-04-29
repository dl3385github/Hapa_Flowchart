import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineEye } from 'react-icons/hi';
import { RootState } from '../store';
import { createFlowchart, deleteFlowchart } from '../store/slices/flowchartsSlice';
import { Flowchart } from '../types';

const Dashboard: React.FC = () => {
  const flowcharts = useSelector((state: RootState) => state.flowcharts.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [showNewFlowchartModal, setShowNewFlowchartModal] = useState(false);
  const [newFlowchartName, setNewFlowchartName] = useState('');
  const [newFlowchartDescription, setNewFlowchartDescription] = useState('');
  
  const handleCreateNewFlowchart = () => {
    if (newFlowchartName.trim()) {
      dispatch(createFlowchart({ 
        name: newFlowchartName, 
        description: newFlowchartDescription 
      }));
      
      setNewFlowchartName('');
      setNewFlowchartDescription('');
      setShowNewFlowchartModal(false);
      
      // Navigate to the newly created flowchart
      const newId = Object.keys(flowcharts).slice(-1)[0];
      if (newId) {
        navigate(`/editor/${newId}`);
      }
    }
  };
  
  const handleDeleteFlowchart = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(t('confirm_delete_flowchart'))) {
      dispatch(deleteFlowchart(id));
    }
  };
  
  const openFlowchart = (id: string) => {
    navigate(`/editor/${id}`);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
        <button
          onClick={() => setShowNewFlowchartModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <HiOutlinePlus className="mr-2" />
          {t('new_flowchart')}
        </button>
      </div>
      
      {/* Recent Flowcharts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{t('recent_flowcharts')}</h2>
        
        {Object.keys(flowcharts).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {t('no_flowcharts_yet')}
            </p>
            <button
              onClick={() => setShowNewFlowchartModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('create_first_flowchart')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(flowcharts).map((flowchart: Flowchart) => (
              <div
                key={flowchart.id}
                onClick={() => openFlowchart(flowchart.id)}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{flowchart.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openFlowchart(flowchart.id);
                      }}
                      className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      title={t('view')}
                    >
                      <HiOutlineEye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteFlowchart(flowchart.id, e)}
                      className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      title={t('delete')}
                    >
                      <HiOutlineTrash className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {flowchart.description && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {flowchart.description}
                  </p>
                )}
                
                <div className="mt-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {t('last_modified')}: {new Date(flowchart.updatedAt).toLocaleDateString()}
                  </span>
                  <span>
                    {t('version')}: {flowchart.version}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* New Flowchart Modal */}
      {showNewFlowchartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">{t('new_flowchart')}</h2>
            
            <div className="mb-4">
              <label htmlFor="flowchart-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('name')}
              </label>
              <input
                id="flowchart-name"
                type="text"
                value={newFlowchartName}
                onChange={(e) => setNewFlowchartName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('flowchart_name_placeholder')}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="flowchart-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('description')} ({t('optional')})
              </label>
              <textarea
                id="flowchart-description"
                value={newFlowchartDescription}
                onChange={(e) => setNewFlowchartDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('flowchart_description_placeholder')}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewFlowchartModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreateNewFlowchart}
                disabled={!newFlowchartName.trim()}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md transition-colors ${
                  !newFlowchartName.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {t('create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 