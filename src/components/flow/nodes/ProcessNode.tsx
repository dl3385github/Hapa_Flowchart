import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const ProcessNode: React.FC<NodeProps> = ({ data, isConnectable, selected }) => {
  return (
    <div 
      className={`px-4 py-2 min-w-[150px] min-h-[60px] flex flex-col justify-center transition-all ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      
      <div className="text-center">
        <div className="font-medium text-gray-800 dark:text-gray-200">{data.label}</div>
        {data.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.description}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      
      {/* Side handles for alternative flows */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#555', top: '50%' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: '#555', top: '50%' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(ProcessNode); 