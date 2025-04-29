import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HiOutlineDatabase } from 'react-icons/hi';

const DataNode: React.FC<NodeProps> = ({ data, isConnectable, selected }) => {
  return (
    <div 
      className={`px-4 py-2 min-w-[150px] min-h-[60px] flex flex-col justify-center transition-all ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#8b5cf6' }}
        isConnectable={isConnectable}
      />
      
      <div className="flex items-center justify-center">
        <HiOutlineDatabase className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400" />
        <div className="text-center">
          <div className="font-medium text-gray-800 dark:text-gray-200">{data.label || 'Data'}</div>
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:bg-opacity-30 dark:text-purple-300">
            {data.dataType}
          </span>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#8b5cf6' }}
        isConnectable={isConnectable}
      />
      
      {/* Side handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#8b5cf6', top: '50%' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: '#8b5cf6', top: '50%' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(DataNode); 