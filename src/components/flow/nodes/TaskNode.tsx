import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HiOutlineClipboardCheck, HiOutlineClock, HiOutlineUsers } from 'react-icons/hi';
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

const TaskNode: React.FC<NodeProps> = ({ data, isConnectable, selected }) => {
  const [taskInfo, setTaskInfo] = useState<HapaTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    }
  }, [data.taskId]);
  
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
      className={`relative px-4 py-3 min-w-[200px] transition-all ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#3b82f6' }}
        isConnectable={isConnectable}
      />
      
      {loading ? (
        <div className="animate-pulse flex flex-col space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : taskInfo ? (
        <>
          <div className="font-medium text-gray-900 dark:text-white">{taskInfo.title}</div>
          
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
        </>
      ) : (
        <>
          <div className="font-medium text-gray-900 dark:text-white">{data.label || 'Task'}</div>
          {data.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data.description}
            </div>
          )}
          {data.taskId && (
            <div className="text-xs text-blue-500 mt-2 flex items-center">
              <HiOutlineClipboardCheck className="w-3 h-3 mr-1" />
              Linked to task {data.taskId}
            </div>
          )}
        </>
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