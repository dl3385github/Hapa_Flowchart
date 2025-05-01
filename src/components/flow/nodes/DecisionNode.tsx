import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const DecisionNode: React.FC<NodeProps> = ({ data, isConnectable, selected }) => {
  return (
    <div className="diamond-container">
      <div
        className={`diamond min-w-[120px] min-h-[120px] flex items-center justify-center transition-all 
          bg-yellow-100 border-2 ${selected ? 'border-yellow-600 dark:border-yellow-500' : 'border-yellow-500 dark:border-yellow-400'}
          dark:bg-yellow-800 dark:bg-opacity-80
          ${selected ? 'ring-4 ring-yellow-400 ring-opacity-60 dark:ring-yellow-500 dark:ring-opacity-50 transform scale-105' : ''}
        `}
        style={{ 
          boxShadow: selected ? '0 8px 16px rgba(245, 158, 11, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease'
        }}
      >
        <div className="text-center p-2">
          <div className={`font-medium text-sm ${selected ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-800 dark:text-gray-200'}`}>
            {data.label}
          </div>
        </div>
      </div>

      {/* Four handles positioned at the points of the diamond */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: selected ? '#d97706' : '#EAB308', 
          width: selected ? '12px' : '10px', 
          height: selected ? '12px' : '10px', 
          border: '2px solid white' 
        }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ 
          background: selected ? '#d97706' : '#EAB308', 
          width: selected ? '12px' : '10px', 
          height: selected ? '12px' : '10px', 
          border: '2px solid white' 
        }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ 
          background: selected ? '#d97706' : '#EAB308', 
          width: selected ? '12px' : '10px', 
          height: selected ? '12px' : '10px', 
          border: '2px solid white' 
        }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ 
          background: selected ? '#d97706' : '#EAB308', 
          width: selected ? '12px' : '10px', 
          height: selected ? '12px' : '10px', 
          border: '2px solid white' 
        }}
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
      
      {/* Selection indicator */}
      {selected && (
        <div className="absolute -top-3 -right-3 z-10">
          <div className="bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md">
            ✓
          </div>
        </div>
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