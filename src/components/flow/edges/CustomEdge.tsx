import React, { memo } from 'react';
import { 
  EdgeProps, 
  getSmoothStepPath, 
  EdgeLabelRenderer, 
  getBezierPath 
} from 'reactflow';

const CustomEdge: React.FC<EdgeProps> = ({
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
  // Choose the path function based on edge type
  const pathFunction = data?.edgeType === 'bezier' ? getBezierPath : getSmoothStepPath;
  
  // Get edge path
  const [edgePath, labelX, labelY] = pathFunction({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Style based on selection state - make selected edges more prominent
  const edgeStyle = {
    ...style,
    stroke: selected ? '#3b82f6' : style.stroke || '#b1b1b7',
    strokeWidth: selected ? 3 : 1.5,
    cursor: 'pointer', // Add pointer cursor to indicate it's selectable
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
      
      {/* Only render label if it exists */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              cursor: 'pointer',
            }}
            className={`
              px-2 py-1 rounded-md text-xs
              ${selected 
                ? 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 text-blue-800 dark:text-blue-200 border border-blue-400 shadow-md' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }
              transition-all duration-100
            `}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(CustomEdge); 