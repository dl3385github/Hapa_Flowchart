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
    strokeWidth: selected ? 2 : 1,
    strokeDasharray: data?.condition ? '5,5' : undefined,
  };

  // Label background color based on the condition
  const getLabelColorClass = () => {
    if (selected) {
      return 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 text-blue-800 dark:text-blue-200';
    }
    
    if (data?.condition) {
      return data.condition === 'yes' || data.condition === 'true'
        ? 'bg-green-100 dark:bg-green-900 dark:bg-opacity-30 text-green-800 dark:text-green-200'
        : 'bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 text-yellow-800 dark:text-yellow-200';
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
      
      {/* Label showing the condition */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={`
            px-2 py-1 rounded-md text-xs font-medium shadow-sm
            ${getLabelColorClass()}
          `}
        >
          {data?.condition || data?.label || ''}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(ConditionalEdge); 