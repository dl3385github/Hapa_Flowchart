import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const DecisionNode: React.FC<NodeProps> = ({ data, isConnectable, selected }) => {
  return (
    <div className="diamond-container">
      <div
        className={`diamond min-w-[120px] min-h-[120px] flex items-center justify-center transition-all ${
          selected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
        }`}
      >
        <div className="text-center p-2">
          <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">{data.label}</div>
        </div>
      </div>

      {/* Four handles positioned at the points of the diamond */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: '#555' }}
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