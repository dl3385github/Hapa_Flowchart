import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const SimpleTestNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div
      style={{
        background: '#ff0000',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        border: '2px solid black',
        width: '150px',
        height: '60px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#000', width: '10px', height: '10px' }}
      />
      <div>{data?.label || 'Test Node'}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#000', width: '10px', height: '10px' }}
      />
    </div>
  );
};

export default memo(SimpleTestNode); 