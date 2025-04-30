import { store } from '../store';
import { 
  setLocalPeerId, 
  setConnectionStatus, 
  setPeerConnection, 
  removePeerConnection, 
  updatePeer,
  setSignalingError
} from '../store/slices/collaborationSlice';

// Mock hypercore key handling for now
const generateHypercoreKey = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private localPeerId: string | null = null;
  private hypercoreKey: string | null = null;
  private signalingServer: WebSocket | null = null;
  
  // Initialize the service
  public async initialize(): Promise<string> {
    try {
      // Generate a local peer ID if we don't have one
      if (!this.localPeerId) {
        this.localPeerId = generateHypercoreKey();
        store.dispatch(setLocalPeerId(this.localPeerId));
      }
      
      // Connect to signaling server (would be replaced with real implementation)
      await this.connectToSignalingServer();
      
      return this.localPeerId;
    } catch (error) {
      console.error('Failed to initialize WebRTC service:', error);
      store.dispatch(setSignalingError('Failed to initialize WebRTC service'));
      throw error;
    }
  }
  
  // Create and share a flowchart
  public async createSharedFlowchart(): Promise<string> {
    try {
      // Generate a new Hypercore key for this flowchart
      this.hypercoreKey = generateHypercoreKey();
      
      // In a real implementation, we would:
      // 1. Create a new Hypercore feed
      // 2. Set up replication
      // 3. Configure discovery via Hyperswarm
      
      return this.hypercoreKey;
    } catch (error) {
      console.error('Failed to create shared flowchart:', error);
      store.dispatch(setSignalingError('Failed to create shared flowchart'));
      throw error;
    }
  }
  
  // Join an existing shared flowchart
  public async joinSharedFlowchart(hypercoreKey: string): Promise<boolean> {
    try {
      this.hypercoreKey = hypercoreKey;
      
      // Send join request through signaling server
      if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
        this.signalingServer.send(JSON.stringify({
          type: 'join',
          flowchartKey: hypercoreKey,
          peerId: this.localPeerId
        }));
        
        // Set connection status to connecting
        store.dispatch(setConnectionStatus(true));
        
        // In a real implementation:
        // 1. Look up peers in Hyperswarm with this hypercoreKey
        // 2. Establish connections
        // 3. Start replicating the Hypercore feed
        
        return true;
      } else {
        throw new Error('Signaling server not connected');
      }
    } catch (error) {
      console.error('Failed to join shared flowchart:', error);
      store.dispatch(setSignalingError('Failed to join: ' + error.message));
      store.dispatch(setConnectionStatus(false));
      return false;
    }
  }
  
  // Connect to the signaling server
  private async connectToSignalingServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // In a real implementation, we would connect to an actual signaling server
        // For now, we simulate this with a mock implementation
        console.log('Connecting to signaling server...');
        
        // Simulate successful connection after a delay
        setTimeout(() => {
          this.signalingServer = {} as WebSocket;
          this.signalingServer.readyState = WebSocket.OPEN;
          this.signalingServer.send = (data: string) => {
            console.log('Sending to signaling server:', data);
            
            // Simulate receiving a response
            setTimeout(() => {
              if (this.onSignalingMessage) {
                const message = JSON.parse(data);
                
                if (message.type === 'join') {
                  // Simulate discovering peers
                  this.simulateDiscoveredPeers(message.flowchartKey);
                }
              }
            }, 1000);
          };
          
          resolve();
        }, 500);
      } catch (error) {
        console.error('Failed to connect to signaling server:', error);
        reject(error);
      }
    });
  }
  
  // Handle incoming signaling messages
  private onSignalingMessage = (message: any) => {
    try {
      if (message.type === 'offer' && message.target === this.localPeerId) {
        this.handleRemoteOffer(message.source, message.offer);
      } else if (message.type === 'answer' && message.target === this.localPeerId) {
        this.handleRemoteAnswer(message.source, message.answer);
      } else if (message.type === 'ice-candidate' && message.target === this.localPeerId) {
        this.handleRemoteICECandidate(message.source, message.candidate);
      } else if (message.type === 'peer-joined') {
        this.handlePeerJoined(message.peerId, message.peerInfo);
      } else if (message.type === 'peer-left') {
        this.handlePeerLeft(message.peerId);
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  };
  
  // Handle a new peer joining
  private handlePeerJoined(peerId: string, peerInfo: any) {
    console.log('New peer joined:', peerId);
    
    // Update store with new peer
    store.dispatch(updatePeer({
      peerId,
      info: {
        peerId,
        name: peerInfo?.name || 'Anonymous',
        lastSeen: new Date().toISOString()
      }
    }));
    
    // Initiate connection to the new peer
    this.connectToPeer(peerId);
  }
  
  // Handle a peer leaving
  private handlePeerLeft(peerId: string) {
    console.log('Peer left:', peerId);
    
    // Clean up connections for this peer
    this.cleanupPeerConnection(peerId);
  }
  
  // Initiate a connection to a peer
  private async connectToPeer(peerId: string) {
    try {
      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      
      // Store the connection
      this.peerConnections.set(peerId, peerConnection);
      
      // Create a data channel
      const dataChannel = peerConnection.createDataChannel('flowchart-data');
      this.setupDataChannel(peerId, dataChannel);
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignalingMessage({
            type: 'ice-candidate',
            source: this.localPeerId,
            target: peerId,
            candidate: event.candidate
          });
        }
      };
      
      // Create an offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send the offer via signaling server
      this.sendSignalingMessage({
        type: 'offer',
        source: this.localPeerId,
        target: peerId,
        offer: peerConnection.localDescription
      });
      
      // Update Redux store
      store.dispatch(setPeerConnection({
        peerId,
        connection: 'establishing'
      }));
      
    } catch (error) {
      console.error('Failed to connect to peer:', error);
      store.dispatch(setSignalingError(`Failed to connect to peer ${peerId}`));
    }
  }
  
  // Handle a remote connection offer
  private async handleRemoteOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    try {
      // Create a new RTCPeerConnection if one doesn't exist
      if (!this.peerConnections.has(peerId)) {
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });
        
        // Store the connection
        this.peerConnections.set(peerId, peerConnection);
        
        // Handle incoming data channels
        peerConnection.ondatachannel = (event) => {
          this.setupDataChannel(peerId, event.channel);
        };
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.sendSignalingMessage({
              type: 'ice-candidate',
              source: this.localPeerId,
              target: peerId,
              candidate: event.candidate
            });
          }
        };
      }
      
      const peerConnection = this.peerConnections.get(peerId)!;
      
      // Set the remote description
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create an answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send the answer via signaling server
      this.sendSignalingMessage({
        type: 'answer',
        source: this.localPeerId,
        target: peerId,
        answer: peerConnection.localDescription
      });
      
      // Update Redux store
      store.dispatch(setPeerConnection({
        peerId,
        connection: 'establishing'
      }));
      
    } catch (error) {
      console.error('Failed to handle remote offer:', error);
      store.dispatch(setSignalingError(`Failed to connect to peer ${peerId}`));
    }
  }
  
  // Handle a remote answer to our offer
  private async handleRemoteAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    try {
      const peerConnection = this.peerConnections.get(peerId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Failed to handle remote answer:', error);
    }
  }
  
  // Handle a remote ICE candidate
  private async handleRemoteICECandidate(peerId: string, candidate: RTCIceCandidateInit) {
    try {
      const peerConnection = this.peerConnections.get(peerId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Failed to handle remote ICE candidate:', error);
    }
  }
  
  // Set up a data channel
  private setupDataChannel(peerId: string, dataChannel: RTCDataChannel) {
    this.dataChannels.set(peerId, dataChannel);
    
    dataChannel.onopen = () => {
      console.log(`Data channel to ${peerId} opened`);
      
      // Update Redux store
      store.dispatch(setPeerConnection({
        peerId,
        connection: 'connected'
      }));
    };
    
    dataChannel.onclose = () => {
      console.log(`Data channel to ${peerId} closed`);
      this.cleanupPeerConnection(peerId);
    };
    
    dataChannel.onerror = (error) => {
      console.error(`Data channel error with ${peerId}:`, error);
    };
    
    dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(peerId, event.data);
    };
  }
  
  // Handle a message from a data channel
  private handleDataChannelMessage(peerId: string, data: string) {
    try {
      const message = JSON.parse(data);
      
      // Handle different message types
      if (message.type === 'flowchart-update') {
        // Handle flowchart update
        // This would be implemented based on your application's needs
      } else if (message.type === 'cursor-update') {
        // Update peer cursor position
        store.dispatch(updatePeer({
          peerId,
          info: {
            cursor: {
              x: message.x,
              y: message.y
            }
          }
        }));
      }
    } catch (error) {
      console.error('Failed to handle data channel message:', error);
    }
  }
  
  // Send a message through the signaling server
  private sendSignalingMessage(message: any) {
    if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
      this.signalingServer.send(JSON.stringify(message));
    } else {
      console.error('Signaling server not connected');
    }
  }
  
  // Clean up a peer connection
  private cleanupPeerConnection(peerId: string) {
    // Close and remove data channel
    const dataChannel = this.dataChannels.get(peerId);
    if (dataChannel) {
      dataChannel.close();
      this.dataChannels.delete(peerId);
    }
    
    // Close and remove peer connection
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }
    
    // Update Redux store
    store.dispatch(removePeerConnection(peerId));
  }
  
  // Simulate discovered peers for testing
  private simulateDiscoveredPeers(flowchartKey: string) {
    // Simulate 1-3 peers
    const peerCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < peerCount; i++) {
      const peerId = `peer-${i}-${Math.random().toString(36).substring(2, 8)}`;
      
      setTimeout(() => {
        this.onSignalingMessage({
          type: 'peer-joined',
          peerId,
          peerInfo: {
            name: `User ${i+1}`,
          }
        });
      }, 800 + i * 500);
    }
  }
  
  // Send a flowchart update to all connected peers
  public sendFlowchartUpdate(flowchartData: any) {
    const message = JSON.stringify({
      type: 'flowchart-update',
      data: flowchartData,
      timestamp: Date.now()
    });
    
    // Send to all connected peers
    this.dataChannels.forEach((dataChannel) => {
      if (dataChannel.readyState === 'open') {
        dataChannel.send(message);
      }
    });
  }
  
  // Send cursor position to all connected peers
  public sendCursorPosition(x: number, y: number) {
    const message = JSON.stringify({
      type: 'cursor-update',
      x,
      y,
      timestamp: Date.now()
    });
    
    // Send to all connected peers
    this.dataChannels.forEach((dataChannel) => {
      if (dataChannel.readyState === 'open') {
        dataChannel.send(message);
      }
    });
  }
  
  // Close all connections
  public cleanup() {
    // Close all data channels and peer connections
    this.dataChannels.forEach((dataChannel) => {
      dataChannel.close();
    });
    
    this.peerConnections.forEach((peerConnection) => {
      peerConnection.close();
    });
    
    // Clear the maps
    this.dataChannels.clear();
    this.peerConnections.clear();
    
    // Close signaling connection
    if (this.signalingServer) {
      // this.signalingServer.close();
      this.signalingServer = null;
    }
    
    // Reset state
    this.hypercoreKey = null;
    
    // Update Redux store
    store.dispatch(setConnectionStatus(false));
  }
}

// Create a singleton instance
const webRTCService = new WebRTCService();

export default webRTCService; 