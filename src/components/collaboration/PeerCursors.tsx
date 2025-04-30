import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const PeerCursors: React.FC = () => {
  const peers = useSelector((state: RootState) => state.collaboration.peers);
  
  return (
    <>
      {Object.values(peers).map(peer => {
        if (!peer.cursor) return null;
        
        return (
          <div 
            key={peer.peerId}
            className="absolute pointer-events-none"
            style={{
              left: peer.cursor.x,
              top: peer.cursor.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 1000
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                transform: 'translate(-4px, -4px)'
              }}
            >
              <path
                d="M5.5 2.5L19.5 16.5L12.5 17.5L10.5 21.5L5.5 2.5Z"
                fill={peer.color || '#FF6B6B'}
                stroke="#000"
                strokeWidth="1"
              />
            </svg>
            <div 
              className="absolute top-6 left-6 bg-gray-800 text-white px-2 py-1 rounded-md text-xs shadow-md whitespace-nowrap"
              style={{
                backgroundColor: peer.color || '#FF6B6B'
              }}
            >
              {peer.name || `User ${peer.peerId.substring(0, 6)}`}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default PeerCursors; 