import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CollaboratorInfo } from '../../types';

interface CollaborationState {
  isConnected: boolean;
  localPeerId: string | null;
  peers: Record<string, CollaboratorInfo>;
  activeFlowchartKey: string | null;
  peerConnections: Record<string, any>; // WebRTC connections are not serializable
  signalingError: string | null;
}

const initialState: CollaborationState = {
  isConnected: false,
  localPeerId: null,
  peers: {},
  activeFlowchartKey: null,
  peerConnections: {},
  signalingError: null,
};

export const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    setLocalPeerId: (state, action: PayloadAction<string>) => {
      state.localPeerId = action.payload;
    },
    
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (!action.payload) {
        // When disconnected, clear peer state
        state.peers = {};
        state.peerConnections = {};
      }
    },
    
    setPeerConnection: (state, action: PayloadAction<{ peerId: string; connection: any }>) => {
      const { peerId, connection } = action.payload;
      state.peerConnections[peerId] = connection;
    },
    
    removePeerConnection: (state, action: PayloadAction<string>) => {
      const peerId = action.payload;
      delete state.peerConnections[peerId];
      delete state.peers[peerId];
    },
    
    updatePeer: (state, action: PayloadAction<{ peerId: string; info: Partial<CollaboratorInfo> }>) => {
      const { peerId, info } = action.payload;
      
      if (!state.peers[peerId]) {
        state.peers[peerId] = {
          peerId,
          lastSeen: new Date().toISOString(),
          ...info
        };
      } else {
        state.peers[peerId] = {
          ...state.peers[peerId],
          ...info,
          lastSeen: new Date().toISOString(),
        };
      }
    },
    
    updatePeerCursor: (state, action: PayloadAction<{ peerId: string; x: number; y: number }>) => {
      const { peerId, x, y } = action.payload;
      
      if (state.peers[peerId]) {
        state.peers[peerId].cursor = { x, y };
        state.peers[peerId].lastSeen = new Date().toISOString();
      }
    },
    
    setActiveFlowchartKey: (state, action: PayloadAction<string | null>) => {
      state.activeFlowchartKey = action.payload;
    },
    
    clearPeers: (state) => {
      state.peers = {};
      // We don't clear peerConnections here as they need to be properly closed
    },
    
    setSignalingError: (state, action: PayloadAction<string | null>) => {
      state.signalingError = action.payload;
    },
  },
});

export const {
  setLocalPeerId,
  setConnectionStatus,
  setPeerConnection,
  removePeerConnection,
  updatePeer,
  updatePeerCursor,
  setActiveFlowchartKey,
  clearPeers,
  setSignalingError,
} = collaborationSlice.actions;

export default collaborationSlice.reducer; 