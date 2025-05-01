import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const ProcessNode: React.FC<NodeProps> = ({ data, isConnectable, selected }) => {
  return (
    <div 
      className={`px-4 py-2 min-w-[150px] min-h-[60px] flex flex-col justify-center transition-all 
        bg-white border-2 ${selected ? 'border-blue-600 dark:border-blue-500' : 'border-blue-500 dark:border-blue-400'} shadow-lg rounded-md
        dark:bg-gray-800 
        ${selected ? 'ring-4 ring-blue-400 ring-opacity-80 dark:ring-blue-500 dark:ring-opacity-60 transform scale-105' : ''}`}
      style={{ 
        boxShadow: selected ? '0 8px 16px rgba(59, 130, 246, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)', 
        fontSize: '14px',
        transition: 'all 0.2s ease'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: selected ? '#1d4ed8' : '#3B82F6', 
          width: selected ? '14px' : '12px', 
          height: selected ? '14px' : '12px', 
          border: '2px solid white' 
        }}
        isConnectable={isConnectable}
      />
      
      <div className="text-center">
        <div className={`font-medium ${selected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
          {data.label}
        </div>
        {data.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.description}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: selected ? '#1d4ed8' : '#3B82F6', 
          width: selected ? '14px' : '12px', 
          height: selected ? '14px' : '12px', 
          border: '2px solid white' 
        }}
        isConnectable={isConnectable}
      />
      
      {/* Side handles for alternative flows */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ 
          background: selected ? '#1d4ed8' : '#3B82F6', 
          width: selected ? '14px' : '12px', 
          height: selected ? '14px' : '12px', 
          border: '2px solid white' 
        }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ 
          background: selected ? '#1d4ed8' : '#3B82F6', 
          width: selected ? '14px' : '12px', 
          height: selected ? '14px' : '12px', 
          border: '2px solid white' 
        }}
        isConnectable={isConnectable}
      />
      
      {/* Selection indicator */}
      {selected && (
        <div className="absolute -top-3 -right-3">
          <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md">
            ✓
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ProcessNode); 