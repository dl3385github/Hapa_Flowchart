import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineEye, 
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineGlobe,
  HiOutlineArrowLeft
} from 'react-icons/hi';
import { RootState } from '../store';
import { createFlowchart, deleteFlowchart } from '../store/slices/flowchartsSlice';
import { Flowchart } from '../types';

// Mock Consul data - in a real app this would come from the API
const mockConsuls = [
  {
    id: 'consul-1',
    name: 'Product Development',
    description: 'Consul for managing product development tasks and flowcharts',
    memberCount: 12,
    isOwner: true,
    flowcharts: ['flowchart-1', 'flowchart-3'],
  },
  {
    id: 'consul-2',
    name: 'Marketing Team',
    description: 'Marketing strategy and campaign planning',
    memberCount: 8,
    isOwner: false,
    flowcharts: ['flowchart-2'],
  },
  {
    id: 'consul-3',
    name: 'Engineering',
    description: 'Technical development and architecture',
    memberCount: 15,
    isOwner: false,
    flowcharts: [],
  },
];

type TabType = 'my-flowcharts' | 'my-consuls' | 'all-consuls';

interface DashboardProps {
  consulView?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ consulView = false }) => {
  const flowcharts = useSelector((state: RootState) => state.flowcharts.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id: consulId } = useParams<{ id: string }>();
  
  const [showNewFlowchartModal, setShowNewFlowchartModal] = useState(false);
  const [newFlowchartName, setNewFlowchartName] = useState('');
  const [newFlowchartDescription, setNewFlowchartDescription] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('my-flowcharts');
  const [selectedConsul, setSelectedConsul] = useState<string | null>(null);
  
  // If in consulView, set the selectedConsul from the URL param
  useEffect(() => {
    if (consulView && consulId) {
      setSelectedConsul(consulId);
      setActiveTab('my-consuls');
    }
  }, [consulView, consulId]);
  
  const handleCreateNewFlowchart = () => {
    if (newFlowchartName.trim()) {
      dispatch(createFlowchart({ 
        name: newFlowchartName, 
        description: newFlowchartDescription,
        // Add consulId if a consul is selected
        ...(selectedConsul && { metadata: { consulId: selectedConsul } })
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
  
  const renderFlowchartCards = (flowchartsList: Flowchart[]) => {
    if (flowchartsList.length === 0) {
      return (
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
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flowchartsList.map((flowchart: Flowchart) => (
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
                {new Date(flowchart.updatedAt).toLocaleDateString()}
              </span>
              <span>
                {flowchart.metadata?.consulId && (
                  <span className="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full px-2 py-0.5 text-xs">
                    <HiOutlineUserGroup className="mr-1 h-3 w-3" />
                    {mockConsuls.find(c => c.id === flowchart.metadata?.consulId)?.name || 'Consul'}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderContent = () => {
    // If we're in consulView mode, directly show the consul's flowcharts
    if (consulView && consulId) {
      const consul = mockConsuls.find(c => c.id === consulId);
      
      if (!consul) {
        return <div className="text-center text-gray-500 dark:text-gray-400">{t('consul_not_found')}</div>;
      }
      
      const consulFlowcharts = Object.values(flowcharts).filter(
        f => f.metadata?.consulId === consulId
      );
      
      return (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{consul.name}</h1>
            <button
              onClick={() => setShowNewFlowchartModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <HiOutlinePlus className="mr-2" />
              {t('new_flowchart')}
            </button>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">{t('consul_flowcharts')}</h2>
            {renderFlowchartCards(consulFlowcharts)}
          </div>
        </div>
      );
    }
    
    // Standard dashboard view
    if (activeTab === 'my-flowcharts') {
      return (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{t('my_flowcharts')}</h1>
            <button
              onClick={() => setShowNewFlowchartModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <HiOutlinePlus className="mr-2" />
              {t('new_flowchart')}
            </button>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">{t('recent_flowcharts')}</h2>
            {renderFlowchartCards(Object.values(flowcharts))}
          </div>
        </div>
      );
    } else if (activeTab === 'my-consuls') {
      // Filter to only include consuls where the user is an owner
      const myConsuls = mockConsuls.filter(consul => consul.isOwner);
      
      if (selectedConsul) {
        const consul = myConsuls.find(c => c.id === selectedConsul);
        
        if (!consul) {
          return <div>Consul not found</div>;
        }
        
        const consulFlowcharts = Object.values(flowcharts).filter(
          f => f.metadata?.consulId === selectedConsul
        );
        
        return (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setSelectedConsul(null)}
                className="text-blue-600 dark:text-blue-400 flex items-center"
              >
                <HiOutlineArrowLeft className="mr-1" /> {t('back_to_consuls')}
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">{consul.name}</h1>
              <button
                onClick={() => {
                  setShowNewFlowchartModal(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <HiOutlinePlus className="mr-2" />
                {t('new_flowchart')}
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8">{consul.description}</p>
            
            <h2 className="text-lg font-semibold mb-4">{t('consul_flowcharts')}</h2>
            {renderFlowchartCards(consulFlowcharts)}
          </div>
        );
      }
      
      return (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{t('my_consuls')}</h1>
            <button
              onClick={() => {}} // Would open a "Create Consul" modal in a real app
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <HiOutlinePlus className="mr-2" />
              {t('create_consul')}
            </button>
          </div>
          
          {myConsuls.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                You don't have any Consuls yet.
              </p>
              <button
                onClick={() => {}} // Would open a "Create Consul" modal in a real app
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('create_consul')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myConsuls.map(consul => (
                <div
                  key={consul.id}
                  onClick={() => setSelectedConsul(consul.id)}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{consul.name}</h3>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {consul.description}
                  </p>
                  
                  <div className="mt-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {consul.memberCount} members
                    </span>
                    <span>
                      {Object.values(flowcharts).filter(f => f.metadata?.consulId === consul.id).length} flowcharts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Main content - no left sidebar in normal view */}
      <div className="flex-1 p-6 overflow-y-auto">
        {renderContent()}
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