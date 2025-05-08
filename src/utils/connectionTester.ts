/**
 * Utility for testing P2P connections
 */
import p2pService from '../services/P2PService';
import { store } from '../store';

// Log connection details for debugging
export function logConnectionState(): void {
  const state = store.getState().collaboration;
  
  console.log('=== P2P Connection Test ===');
  console.log('Local Peer ID:', state.localPeerId);
  console.log('Active Flowchart Key:', state.activeFlowchartKey);
  console.log('Connected Peers:', Object.keys(state.peers).length);
  
  Object.entries(state.peers).forEach(([peerId, peerInfo]) => {
    console.log(`- Peer ${peerId.slice(0, 6)}: ${state.peerConnections[peerId]?.connection || 'unknown'}`);
  });
  
  // Check if P2P service is initialized
  console.log('P2P Initialized:', p2pService.getLocalPeerId() !== null);
  
  // Check active connections
  if (p2pService.getLocalPeerId()) {
    console.log('Data Channels:', (p2pService as any).dataChannels?.size || 0);
    console.log('Peer Connections:', (p2pService as any).peerConnections?.size || 0);
  }
}

// Test if P2P connections can be established
export async function testP2PConnection(): Promise<void> {
  try {
    console.log('Testing P2P connection...');
    
    // Initialize P2P service
    const localPeerId = await p2pService.initialize();
    console.log('Initialized with local peer ID:', localPeerId);
    
    // Create a test flowchart to share
    const testKey = await p2pService.createSharedFlowchart('test-flowchart');
    console.log('Created shared flowchart with key:', testKey);
    
    // Set up an interval to log connection state
    const interval = setInterval(() => {
      logConnectionState();
    }, 2000);
    
    // Clean up after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      console.log('Connection test completed');
      p2pService.cleanup().catch(console.error);
    }, 30000);
    
    return Promise.resolve();
  } catch (error) {
    console.error('P2P connection test failed:', error);
    return Promise.reject(error);
  }
}

// Export a function to trigger the test (can be called from browser console)
// @ts-ignore - Make it available globally for testing
window.testP2PConnection = testP2PConnection;
// @ts-ignore - Make it available globally for testing
window.logP2PState = logConnectionState; 