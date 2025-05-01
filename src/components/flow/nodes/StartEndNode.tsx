import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const StartEndNode: React.FC<NodeProps> = ({ data, isConnectable, selected }) => {
  const isStart = data.nodeType === 'start';
  const isEnd = data.nodeType === 'end';
  
  // Base colors
  const bgColor = isStart 
    ? selected ? 'bg-green-200 dark:bg-green-700' : 'bg-green-100 dark:bg-green-800' 
    : isEnd 
      ? selected ? 'bg-red-200 dark:bg-red-700' : 'bg-red-100 dark:bg-red-800' 
      : selected ? 'bg-gray-200 dark:bg-gray-600' : 'bg-gray-100 dark:bg-gray-700';
                
  const borderColor = isStart 
    ? selected ? 'border-green-600 dark:border-green-500' : 'border-green-500 dark:border-green-400' 
    : isEnd 
      ? selected ? 'border-red-600 dark:border-red-500' : 'border-red-500 dark:border-red-400' 
      : selected ? 'border-gray-600 dark:border-gray-500' : 'border-gray-500 dark:border-gray-400';
  
  const selectRingColor = isStart 
    ? 'ring-green-400 ring-opacity-60 dark:ring-green-500 dark:ring-opacity-50' 
    : isEnd 
      ? 'ring-red-400 ring-opacity-60 dark:ring-red-500 dark:ring-opacity-50' 
      : 'ring-gray-400 ring-opacity-60 dark:ring-gray-500 dark:ring-opacity-50';

  const selectionColor = isStart ? 'bg-green-500' : isEnd ? 'bg-red-500' : 'bg-gray-500';
  
  return (
    <div 
      className={`px-4 py-2 min-w-[100px] min-h-[50px] flex flex-col justify-center transition-all rounded-full
        ${bgColor} border-2 ${borderColor} shadow-md
        ${selected ? `ring-4 ${selectRingColor} transform scale-105` : ''}
      `}
      style={{ 
        boxShadow: selected 
          ? isStart 
            ? '0 8px 16px rgba(16, 185, 129, 0.3)' 
            : isEnd 
              ? '0 8px 16px rgba(239, 68, 68, 0.3)' 
              : '0 8px 16px rgba(107, 114, 128, 0.3)' 
          : '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Only add top handle for end node */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ 
            background: isEnd 
              ? selected ? '#dc2626' : '#ef4444' 
              : selected ? '#059669' : '#10b981', 
            width: selected ? '12px' : '10px', 
            height: selected ? '12px' : '10px', 
            border: '2px solid white'
          }}
          isConnectable={isConnectable}
        />
      )}
      
      <div className="text-center">
        <div className={`font-medium text-sm ${
          isStart 
            ? selected ? 'text-green-800 dark:text-green-200' : 'text-green-700 dark:text-green-300' 
            : isEnd 
              ? selected ? 'text-red-800 dark:text-red-200' : 'text-red-700 dark:text-red-300' 
              : selected ? 'text-gray-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'
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
            background: isStart 
              ? selected ? '#059669' : '#10b981' 
              : selected ? '#dc2626' : '#ef4444', 
            width: selected ? '12px' : '10px', 
            height: selected ? '12px' : '10px', 
            border: '2px solid white'
          }}
          isConnectable={isConnectable}
        />
      )}
      
      {/* Selection indicator */}
      {selected && (
        <div className="absolute -top-3 -right-3">
          <div className={`${selectionColor} text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md`}>
            ✓
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(StartEndNode); 