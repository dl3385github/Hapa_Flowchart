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

  // Style based on selection state
  const edgeStyle = {
    ...style,
    stroke: selected ? '#3b82f6' : style.stroke || '#b1b1b7',
    strokeWidth: selected ? 2 : 1,
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
      
      {/* Only render label if it exists */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`
              px-2 py-1 rounded-md text-xs
              ${selected 
                ? 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 text-blue-800 dark:text-blue-200' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }
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