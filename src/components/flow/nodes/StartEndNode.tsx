import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const StartEndNode: React.FC<NodeProps> = ({ data, isConnectable, selected }) => {
  const isStart = data.nodeType === 'start';
  const isEnd = data.nodeType === 'end';
  
  const bgColor = isStart ? 'bg-green-100 dark:bg-green-800' : 
                isEnd ? 'bg-red-100 dark:bg-red-800' : 
                'bg-gray-100 dark:bg-gray-700';
                
  const borderColor = isStart ? 'border-green-500 dark:border-green-400' : 
                   isEnd ? 'border-red-500 dark:border-red-400' : 
                   'border-gray-500 dark:border-gray-400';
  
  return (
    <div 
      className={`px-4 py-2 min-w-[100px] min-h-[50px] flex flex-col justify-center transition-all rounded-full
        ${bgColor} border-2 ${borderColor} shadow-md
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
      }`}
      style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
    >
      {/* Only add top handle for end node */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ 
            background: isEnd ? '#ef4444' : '#10b981', 
            width: '10px', 
            height: '10px', 
            border: '2px solid white'
          }}
          isConnectable={isConnectable}
        />
      )}
      
      <div className="text-center">
        <div className={`font-medium text-sm ${
          isStart ? 'text-green-700 dark:text-green-300' : 
          isEnd ? 'text-red-700 dark:text-red-300' : 
          'text-gray-700 dark:text-gray-300'
        }`}>
          {data.label || (isStart ? 'Start' : isEnd ? 'End' : 'Terminal')}
        </div>
      </div>
      
      {/* Only add bottom handle for start node */}
      {!isEnd && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ 
            background: isStart ? '#10b981' : '#ef4444', 
            width: '10px', 
            height: '10px', 
            border: '2px solid white'
          }}
          isConnectable={isConnectable}
        />
      )}
    </div>
  );
};

export default memo(StartEndNode); 