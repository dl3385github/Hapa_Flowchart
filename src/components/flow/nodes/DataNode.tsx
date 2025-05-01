import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HiOutlineDatabase } from 'react-icons/hi';

const DataNode: React.FC<NodeProps> = ({ data, isConnectable, selected }) => {
  return (
    <div 
      className={`px-4 py-2 min-w-[150px] min-h-[60px] flex flex-col justify-center transition-all
        ${selected ? 'bg-purple-200 dark:bg-purple-800' : 'bg-purple-100 dark:bg-purple-900'} 
        border-2 ${selected ? 'border-purple-600 dark:border-purple-500' : 'border-purple-500 dark:border-purple-400'} rounded-md shadow-md
        dark:bg-opacity-80
        ${selected ? 'ring-4 ring-purple-400 ring-opacity-60 dark:ring-purple-500 dark:ring-opacity-50 transform scale-105' : ''}
      `}
      style={{ 
        boxShadow: selected ? '0 8px 16px rgba(139, 92, 246, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: selected ? '#7c3aed' : '#8b5cf6', 
          width: selected ? '12px' : '10px', 
          height: selected ? '12px' : '10px', 
          border: '2px solid white' 
        }}
        isConnectable={isConnectable}
      />
      
      <div className="flex items-center justify-center">
        <HiOutlineDatabase className={`w-5 h-5 mr-2 ${selected ? 'text-purple-700 dark:text-purple-300' : 'text-purple-500 dark:text-purple-400'}`} />
        <div className="text-center">
          <div className={`font-medium ${selected ? 'text-purple-800 dark:text-purple-200' : 'text-gray-800 dark:text-gray-200'}`}>
            {data.label || 'Data'}
          </div>
          {data.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data.description}
            </div>
          )}
        </div>
      </div>
      
      {/* Data type badge */}
      {data.dataType && (
        <div className="absolute top-0 right-0 -mt-2 -mr-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${selected 
              ? 'bg-purple-200 text-purple-900 dark:bg-purple-800 dark:bg-opacity-30 dark:text-purple-200' 
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:bg-opacity-30 dark:text-purple-300'
            }`}>
            {data.dataType}
          </span>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: selected ? '#7c3aed' : '#8b5cf6', 
          width: selected ? '12px' : '10px', 
          height: selected ? '12px' : '10px', 
          border: '2px solid white' 
        }}
        isConnectable={isConnectable}
      />
      
      {/* Side handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ 
          background: selected ? '#7c3aed' : '#8b5cf6', 
          width: selected ? '12px' : '10px', 
          height: selected ? '12px' : '10px', 
          border: '2px solid white', 
          top: '50%' 
        }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ 
          background: selected ? '#7c3aed' : '#8b5cf6', 
          width: selected ? '12px' : '10px', 
          height: selected ? '12px' : '10px', 
          border: '2px solid white', 
          top: '50%' 
        }}
        isConnectable={isConnectable}
      />
      
      {/* Selection indicator */}
      {selected && (
        <div className="absolute -top-3 -right-3">
          <div className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md">
            ✓
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(DataNode); 