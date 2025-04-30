import React, { memo } from 'react';
import { 
  EdgeProps, 
  getSmoothStepPath,
  EdgeLabelRenderer,
} from 'reactflow';

const ConditionalEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
}) => {
  // Get edge path
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Add dashed style for conditional flows
  const edgeStyle = {
    ...style,
    stroke: selected ? '#3b82f6' : data?.condition ? '#f59e0b' : '#b1b1b7',
    strokeWidth: selected ? 3 : 1.5,
    strokeDasharray: data?.condition ? '5,5' : undefined,
    cursor: 'pointer', // Add pointer cursor to indicate it's selectable
  };

  // Label background color based on the condition
  const getLabelColorClass = () => {
    if (selected) {
      return 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 text-blue-800 dark:text-blue-200 border border-blue-400';
    }
    
    if (data?.condition) {
      return data.condition === 'yes' || data.condition === 'true'
        ? 'bg-green-100 dark:bg-green-900 dark:bg-opacity-30 text-green-800 dark:text-green-200 border border-green-400'
        : 'bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 text-yellow-800 dark:text-yellow-200 border border-yellow-400';
    }
    
    return 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
  };

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={edgeStyle}
        markerEnd={markerEnd}
      />
      
      {/* Add a transparent wider path for easier selection */}
      <path
        d={edgePath}
        style={{
          stroke: 'transparent',
          strokeWidth: 10,
          cursor: 'pointer',
          fill: 'none',
        }}
      />
      
      {/* Label showing the condition */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            cursor: 'pointer',
          }}
          className={`
            px-2 py-1 rounded-md text-xs font-medium shadow-sm
            ${getLabelColorClass()}
            transition-all duration-100
          `}
        >
          {data?.condition || data?.label || ''}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(ConditionalEdge); 