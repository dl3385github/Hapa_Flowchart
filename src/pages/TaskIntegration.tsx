import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineRefresh, HiOutlineLink, HiOutlineExternalLink } from 'react-icons/hi';
import { HapaTask } from '../types';

const TaskIntegration: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [tasks, setTasks] = useState<HapaTask[]>([]);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Dummy task data for demonstration
  const dummyTasks: HapaTask[] = [
    {
      id: 'task-1',
      title: 'Setup project infrastructure',
      description: 'Create basic project setup with necessary configurations',
      status: 'completed',
      assignees: ['did:example:123'],
      createdAt: '2023-01-15T12:00:00Z',
      updatedAt: '2023-01-20T16:30:00Z',
    },
    {
      id: 'task-2',
      title: 'Implement authentication flow',
      description: 'Create user authentication with DID integration',
      status: 'in-progress',
      assignees: ['did:example:123', 'did:example:456'],
      deadline: '2023-02-28T23:59:59Z',
      createdAt: '2023-01-18T09:15:00Z',
      updatedAt: '2023-02-01T11:45:00Z',
    },
    {
      id: 'task-3',
      title: 'Design UI components',
      description: 'Create reusable UI components following design system',
      status: 'planned',
      assignees: ['did:example:789'],
      deadline: '2023-03-15T23:59:59Z',
      createdAt: '2023-01-25T14:20:00Z',
      updatedAt: '2023-01-25T14:20:00Z',
    },
  ];
  
  const handleConnect = () => {
    setLoading(true);
    setError(null);
    
    // Simulate API connection
    setTimeout(() => {
      if (apiEndpoint.trim() === '') {
        setError(t('invalid_api_endpoint'));
        setLoading(false);
        return;
      }
      
      setTasks(dummyTasks);
      setConnected(true);
      setLoading(false);
    }, 1000);
  };
  
  const handleRefresh = () => {
    setLoading(true);
    
    // Simulate fetching updated tasks
    setTimeout(() => {
      setTasks([...dummyTasks]);
      setLoading(false);
    }, 800);
  };
  
  const handleLinkTask = (taskId: string) => {
    // Navigate to flowchart creation with task link
    navigate(`/editor/new?taskId=${taskId}`);
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('connect_to_task_manager')}</h1>
      
      {!connected ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-lg font-medium mb-4">{t('connect_to_hapa_task_manager')}</h2>
          
          <div className="mb-4">
            <label htmlFor="api-endpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('api_endpoint')}
            </label>
            <input
              id="api-endpoint"
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://api.hapa.app/tasks"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}
          
          <button
            onClick={handleConnect}
            disabled={loading}
            className={`w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md transition-colors ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {loading ? t('connecting') : t('connect')}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t('connected_to')} {apiEndpoint}
              </span>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <HiOutlineRefresh className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
          </div>
          
          {tasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {t('no_tasks_found')}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('task')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('assignees')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('deadline')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {task.assignees.length} {t('members')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleLinkTask(task.id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          title={t('link_to_flowchart')}
                        >
                          <HiOutlineLink className="h-5 w-5" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                          title={t('view_in_task_manager')}
                        >
                          <HiOutlineExternalLink className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskIntegration; 