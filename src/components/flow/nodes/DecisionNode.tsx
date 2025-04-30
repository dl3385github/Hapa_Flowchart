import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const DecisionNode: React.FC<NodeProps> = ({ data, isConnectable, selected }) => {
  return (
    <div className="diamond-container">
      <div
        className={`diamond min-w-[120px] min-h-[120px] flex items-center justify-center transition-all 
          bg-yellow-100 border-2 border-yellow-500 
          dark:bg-yellow-800 dark:border-yellow-400
          ${selected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
        }`}
        style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
      >
        <div className="text-center p-2">
          <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">{data.label}</div>
        </div>
      </div>

      {/* Four handles positioned at the points of the diamond */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#EAB308', width: '10px', height: '10px', border: '2px solid white' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#EAB308', width: '10px', height: '10px', border: '2px solid white' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#EAB308', width: '10px', height: '10px', border: '2px solid white' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: '#EAB308', width: '10px', height: '10px', border: '2px solid white' }}
        isConnectable={isConnectable}
      />
      
      {/* Optional labels for Yes/No paths */}
      {data.showLabels && (
        <>
          <div className="absolute -right-7 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600 dark:text-gray-400">
            {data.rightLabel || 'Yes'}
          </div>
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-600 dark:text-gray-400">
            {data.bottomLabel || 'No'}
          </div>
        </>
      )}
    </div>
  );
};

// Add this CSS to your stylesheet
const styles = `
.diamond-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.diamond {
  position: relative;
  transform: rotate(45deg);
  border-radius: 4px;
}

.diamond > div {
  transform: rotate(-45deg);
}
`;

// Inject the styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default memo(DecisionNode); 