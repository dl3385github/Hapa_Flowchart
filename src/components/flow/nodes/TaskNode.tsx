import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HiOutlineClipboardCheck, HiOutlineClock, HiOutlineUsers, HiOutlinePlus, HiOutlineRefresh, HiOutlineX } from 'react-icons/hi';
import { useDispatch } from 'react-redux';
import { linkTask } from '../../../store/slices/flowchartsSlice';
import { HapaTask } from '../../../types';

// Mock API service for task info
const fetchTaskInfo = async (taskId: string): Promise<HapaTask | null> => {
  // In a real app, this would call your actual API
  console.log('Fetching task info for', taskId);
  
  // Mock response - in real app, this would come from your backend
  return new Promise((resolve) => {
    setTimeout(() => {
      if (taskId) {
        resolve({
          id: taskId,
          title: 'Example Task',
          description: 'This is a placeholder task from Task Manager',
          status: 'in-progress',
          assignees: ['did:example:123', 'did:example:456'],
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        resolve(null);
      }
    }, 500);
  });
};

// Mock API for fetching available tasks
const fetchAvailableTasks = async (): Promise<HapaTask[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'task-001',
          title: 'Research competition',
          description: 'Analyze main competitors in the market',
          status: 'completed',
          assignees: ['did:example:123'],
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task-002',
          title: 'Design mockups',
          description: 'Create UI mockups for the application',
          status: 'in-progress',
          assignees: ['did:example:456'],
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task-003',
          title: 'Develop MVP',
          description: 'Implement core features for the MVP',
          status: 'planned',
          assignees: ['did:example:123', 'did:example:456'],
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }, 800);
  });
};

const TaskNode: React.FC<NodeProps> = ({ id, data, isConnectable, selected }) => {
  const dispatch = useDispatch();
  const [taskInfo, setTaskInfo] = useState<HapaTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSelectingTask, setIsSelectingTask] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<HapaTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  useEffect(() => {
    // Only fetch task info if a taskId is provided
    if (data.taskId) {
      setLoading(true);
      setError(null);
      
      fetchTaskInfo(data.taskId)
        .then((task) => {
          setTaskInfo(task);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching task info:', err);
          setError('Failed to load task info');
          setLoading(false);
        });
    } else {
      setTaskInfo(null);
    }
  }, [data.taskId]);
  
  const handleSelectTask = async () => {
    setIsSelectingTask(true);
    setLoadingTasks(true);
    
    try {
      const tasks = await fetchAvailableTasks();
      setAvailableTasks(tasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };
  
  const handleTaskSelected = (taskId: string) => {
    // Link the task to this node
    dispatch(linkTask({ 
      flowchartId: data.flowchartId || 'default', 
      nodeId: id, 
      taskId 
    }));
    
    setIsSelectingTask(false);
  };
  
  // Determine the status color
  const getStatusColor = () => {
    if (!taskInfo) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    
    switch (taskInfo.status) {
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
  
  // Format a date string
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div 
      className={`relative px-4 py-3 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-md transition-all ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#3b82f6' }}
        isConnectable={isConnectable}
      />
      
      {isSelectingTask ? (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Select a Task</h3>
            <button 
              onClick={() => setIsSelectingTask(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <HiOutlineX className="h-4 w-4" />
            </button>
          </div>
          
          {loadingTasks ? (
            <div className="animate-pulse space-y-2 py-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {availableTasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No tasks available</p>
              ) : (
                availableTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleTaskSelected(task.id)}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{task.description}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="animate-pulse flex flex-col space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : taskInfo ? (
        <div onClick={handleSelectTask} className="cursor-pointer hover:opacity-80 transition-opacity">
          <div className="font-medium text-gray-900 dark:text-white flex items-center">
            {taskInfo.title}
            <HiOutlineRefresh className="ml-2 h-3 w-3 text-gray-400" title="Change task" />
          </div>
          
          {taskInfo.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2 line-clamp-2">
              {taskInfo.description}
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span className={`px-2 py-0.5 rounded-full ${getStatusColor()}`}>
              {taskInfo.status}
            </span>
            
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <HiOutlineUsers className="w-3 h-3 mr-1" />
              {taskInfo.assignees.length}
            </div>
            
            {taskInfo.deadline && (
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <HiOutlineClock className="w-3 h-3 mr-1" />
                {formatDate(taskInfo.deadline)}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{data.label || 'Task'}</div>
          {data.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data.description}
            </div>
          )}
          
          <button
            onClick={handleSelectTask}
            className="mt-3 w-full flex items-center justify-center px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20"
          >
            <HiOutlinePlus className="w-3 h-3 mr-1" />
            Link to Task
          </button>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#3b82f6' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#3b82f6', top: '50%' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(TaskNode); 