import { store } from '../store';
import { 
  setLocalPeerId, 
  setConnectionStatus, 
  setPeerConnection, 
  removePeerConnection, 
  updatePeer,
  setSignalingError,
  setActiveFlowchartKey
} from '../store/slices/collaborationSlice';

// More reliable key generation (we'll simulate Hypercore keys with this)
const generateHypercoreKey = () => {
  // Generate a consistent key format similar to Hypercore
  const key = new Uint8Array(32);
  window.crypto.getRandomValues(key);
  return Array.from(key)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private localPeerId: string | null = null;
  private hypercoreKey: string | null = null;
  private signalingServer: WebSocket | null = null;
  // Map to store flowchart IDs and their corresponding Hyperswarm keys
  private flowchartKeys: Map<string, string> = new Map();
  private flowchartUpdateCallback: ((data: any) => void) | null = null;
  private localUserInfo: any = null;
  private connectionEstablished: boolean = false;
  private pendingDataRequests: Set<string> = new Set(); // Track requested flowcharts
  private connectedFlowchartId: string | null = null;
  
  constructor() {
    // Load previously stored keys from localStorage if available
    this.loadStoredKeys();
  }
  
  // Load stored flowchart keys from localStorage
  private loadStoredKeys(): void {
    try {
      const storedKeys = localStorage.getItem('flowchartKeys');
      if (storedKeys) {
        const keyMap = JSON.parse(storedKeys);
        Object.entries(keyMap).forEach(([id, key]) => {
          this.flowchartKeys.set(id, key as string);
        });
        console.log('Loaded stored flowchart keys:', this.flowchartKeys);
      }
    } catch (err) {
      console.error('Failed to load stored keys:', err);
    }
  }
  
  // Save flowchart keys to localStorage
  private saveStoredKeys(): void {
    try {
      const keyMap: Record<string, string> = {};
      this.flowchartKeys.forEach((value, key) => {
        keyMap[key] = value;
      });
      localStorage.setItem('flowchartKeys', JSON.stringify(keyMap));
    } catch (err) {
      console.error('Failed to save stored keys:', err);
    }
  }
  
  // Initialize the service
  public async initialize(): Promise<string> {
    try {
      // Generate a local peer ID if we don't have one
      if (!this.localPeerId) {
        this.localPeerId = generateHypercoreKey();
        store.dispatch(setLocalPeerId(this.localPeerId));
      }
      
      // Set up direct P2P connection using Hyperswarm for signaling
      // This approach doesn't rely on external signaling servers
      await this.initializeDirectP2P();
      
      return this.localPeerId;
    } catch (error) {
      console.error('Failed to initialize WebRTC service:', error);
      store.dispatch(setSignalingError('Failed to initialize WebRTC service'));
      throw error;
    }
  }

  // Initialize direct P2P connection using Hyperswarm for discovery
  private async initializeDirectP2P(): Promise<void> {
    try {
      console.log('Initializing direct P2P connection using Hyperswarm...');
      
      // In a real implementation, this would use the actual Hyperswarm library
      // For now, we'll simulate the connection to demonstrate the flow
      
      // Connect to mock Hyperswarm network
      await this.connectToSignalingServer();
      
      console.log('Direct P2P connection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize direct P2P connection:', error);
      throw error;
    }
  }
  
  // Get the local peer ID
  public getLocalPeerId(): string | null {
    return this.localPeerId;
  }

  // Set local user information for sharing with peers
  public setLocalUserInfo(userInfo: any): void {
    this.localUserInfo = userInfo;
    console.log('Local user info set:', userInfo);
  }

  // Register callback for flowchart updates
  public onFlowchartUpdate(callback: (data: any) => void): void {
    this.flowchartUpdateCallback = callback;
    console.log('Flowchart update callback registered');
  }

  // Update peer information from awareness data
  public updatePeerFromAwareness(peerId: string, info: any): void {
    store.dispatch(updatePeer({
      peerId,
      info: {
        ...info,
        peerId
      }
    }));
  }
  
  // Create and share a flowchart
  public async createSharedFlowchart(flowchartId: string): Promise<string> {
    try {
      // Check if we already have a key for this flowchart
      if (this.flowchartKeys.has(flowchartId)) {
        this.hypercoreKey = this.flowchartKeys.get(flowchartId)!;
        
        // Set the active flowchart key in Redux
        store.dispatch(setActiveFlowchartKey(this.hypercoreKey));
        
        console.log(`Using existing Hyperswarm key for flowchart ${flowchartId}: ${this.hypercoreKey}`);
        return this.hypercoreKey;
      }
      
      // Generate a new Hypercore key for this flowchart
      this.hypercoreKey = generateHypercoreKey();
      
      // Store the association between flowchart ID and its key
      this.flowchartKeys.set(flowchartId, this.hypercoreKey);
      
      // Track the currently connected flowchart ID
      this.connectedFlowchartId = flowchartId;
      
      // Save to localStorage for persistence
      this.saveStoredKeys();
      
      // Set the active flowchart key in Redux
      store.dispatch(setActiveFlowchartKey(this.hypercoreKey));
      
      console.log(`Created new Hyperswarm key for flowchart ${flowchartId}: ${this.hypercoreKey}`);
      
      // In a real implementation:
      // 1. Create a new Hypercore feed with this key
      // 2. Set up replication
      // 3. Configure discovery via Hyperswarm
      
      return this.hypercoreKey;
    } catch (error) {
      console.error('Failed to create shared flowchart:', error);
      store.dispatch(setSignalingError('Failed to create shared flowchart'));
      throw error;
    }
  }
  
  // Get the Hypercore key for a flowchart
  public getFlowchartKey(flowchartId: string): string | null {
    const key = this.flowchartKeys.get(flowchartId) || null;
    
    // Set the active flowchart key in Redux
    if (key) {
      store.dispatch(setActiveFlowchartKey(key));
    }
    
    return key;
  }
  
  // Join an existing shared flowchart
  public async joinSharedFlowchart(hypercoreKey: string): Promise<boolean> {
    try {
      console.log(`Joining flowchart with Hyperswarm key: ${hypercoreKey}`);
      this.hypercoreKey = hypercoreKey;
      
      // Create a temporary ID for the joined flowchart
      const tempFlowchartId = `shared-${hypercoreKey.substring(0, 8)}`;
      
      // Store the association between the temporary ID and its key
      this.flowchartKeys.set(tempFlowchartId, hypercoreKey);
      
      // Track the currently connected flowchart ID
      this.connectedFlowchartId = tempFlowchartId;
      
      // Save to localStorage for persistence
      this.saveStoredKeys();
      
      // Set the active flowchart key in Redux
      store.dispatch(setActiveFlowchartKey(hypercoreKey));
      
      // In a real P2P implementation:
      // 1. Use the hypercoreKey as the topic for Hyperswarm discovery
      // 2. Locate peers in the Hyperswarm network who are participating in this topic
      // 3. Establish direct WebRTC connections with those peers

      // Simulate joining the Hyperswarm network with this key
      if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
        this.signalingServer.send(JSON.stringify({
          type: 'join',
          flowchartKey: hypercoreKey,
          peerId: this.localPeerId
        }));
        
        // Set connection status to connecting
        store.dispatch(setConnectionStatus(true));
        
        // Mark this flowchart key as pending a data request
        this.pendingDataRequests.add(hypercoreKey);
        
        // We'll mark the connection as established after a brief delay
        // In a real implementation, this would happen after successful Hyperswarm discovery
        setTimeout(() => {
          this.connectionEstablished = true;
          store.dispatch(setConnectionStatus(true));
          console.log(`Successfully joined Hyperswarm network with key: ${hypercoreKey}`);
        }, 1000);
        
        return true;
      } else {
        console.error('P2P discovery mechanism not available');
        throw new Error('P2P discovery mechanism not available');
      }
    } catch (error: unknown) {
      console.error('Failed to join shared flowchart:', error);
      if (error instanceof Error) {
        store.dispatch(setSignalingError('Failed to join: ' + error.message));
      } else {
        store.dispatch(setSignalingError('Failed to join flowchart'));
      }
      store.dispatch(setConnectionStatus(false));
      return false;
    }
  }
  
  // Connect to the signaling server (or Hyperswarm network in a real implementation)
  private async connectToSignalingServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // In a real implementation, this would be replaced with direct Hyperswarm discovery
        // For now, we simulate this with a mock implementation
        console.log('Connecting to P2P discovery network...');
        
        // Simulate successful connection after a delay
        setTimeout(() => {
          this.signalingServer = {} as WebSocket;
          // Use defineProperty to set read-only property in a way that doesn't trigger TypeScript error
          Object.defineProperty(this.signalingServer, 'readyState', {
            value: WebSocket.OPEN,
            writable: false
          });
          this.signalingServer.send = (data: string) => {
            console.log('Broadcasting to P2P network:', data);
            
            // Simulate receiving a response
            setTimeout(() => {
              try {
                const message = JSON.parse(data);
                
                if (message.type === 'join') {
                  // Simulate discovering peers using Hyperswarm
                  this.simulateDiscoveredPeers(message.flowchartKey);
                }
              } catch (error) {
                console.error('Error parsing message:', error);
              }
            }, 1000);
          };
          
          console.log('Successfully connected to P2P discovery network');
          resolve();
        }, 500);
      } catch (error) {
        console.error('Failed to connect to P2P discovery network:', error);
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
      console.error('Error handling P2P message:', error);
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
      console.log(`Initiating direct P2P connection to peer: ${peerId}`);
      
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
      
      // Send the offer via P2P network
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
      
      console.log(`WebRTC offer sent to peer: ${peerId}`);
    } catch (error) {
      console.error('Failed to connect to peer:', error);
      store.dispatch(setSignalingError(`Failed to connect to peer ${peerId}`));
    }
  }
  
  // Handle a remote connection offer
  private async handleRemoteOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    try {
      console.log(`Received WebRTC offer from peer: ${peerId}`);
      
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
      
      // Send the answer via P2P network
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
      
      console.log(`WebRTC answer sent to peer: ${peerId}`);
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
    console.log(`Setting up data channel for peer: ${peerId}`);
    this.dataChannels.set(peerId, dataChannel);
    
    dataChannel.onopen = () => {
      console.log(`Data channel to ${peerId} opened - P2P connection established`);
      
      // Update Redux store
      store.dispatch(setPeerConnection({
        peerId,
        connection: 'connected'
      }));

      // If we have local user info, send it to the peer
      if (this.localUserInfo) {
        this.sendToPeer(peerId, {
          type: 'user-info',
          data: this.localUserInfo
        });
      }

      // If we have a current flowchart key, alert connected peers
      if (this.hypercoreKey) {
        console.log(`Sending current flowchart key to peer: ${this.hypercoreKey}`);
        this.sendToPeer(peerId, {
          type: 'current-flowchart',
          flowchartKey: this.hypercoreKey
        });
        
        // If this key is in our pending data requests, request the flowchart data
        if (this.pendingDataRequests.has(this.hypercoreKey)) {
          console.log(`Requesting flowchart data for key: ${this.hypercoreKey}`);
          this.sendToPeer(peerId, {
            type: 'request-flowchart',
            flowchartKey: this.hypercoreKey
          });
        }
      }
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
  
  // Send data to a specific peer
  private sendToPeer(peerId: string, data: any): boolean {
    try {
      const dataChannel = this.dataChannels.get(peerId);
      if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to send data to peer ${peerId}:`, error);
      return false;
    }
  }
  
  // Handle a message from a data channel
  private handleDataChannelMessage(peerId: string, data: string) {
    try {
      console.log(`Received data from peer ${peerId}:`, data.substring(0, 100) + (data.length > 100 ? '...' : ''));
      const message = JSON.parse(data);
      
      // Handle different message types
      if (message.type === 'flowchart-update') {
        // Handle flowchart update
        console.log('Received flowchart update from peer:', peerId);
        
        // Notify YjsService about the update
        if (this.flowchartUpdateCallback) {
          this.flowchartUpdateCallback(message.data);
        }
      } else if (message.type === 'cursor-update' || message.type === 'cursor-position') {
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
      } else if (message.type === 'user-info') {
        // Update peer user info
        console.log(`Received user info from peer ${peerId}:`, message.data);
        store.dispatch(updatePeer({
          peerId,
          info: {
            ...message.data,
            peerId,
            lastSeen: new Date().toISOString()
          }
        }));
      } else if (message.type === 'current-flowchart') {
        console.log(`Peer ${peerId} is working on flowchart: ${message.flowchartKey}`);
        
        // If we're waiting for this flowchart's data, request it now
        if (this.pendingDataRequests.has(message.flowchartKey)) {
          console.log(`Requesting flowchart data for key: ${message.flowchartKey}`);
          this.sendToPeer(peerId, {
            type: 'request-flowchart',
            flowchartKey: message.flowchartKey
          });
        }
      } else if (message.type === 'request-flowchart') {
        // Peer is requesting flowchart data
        console.log(`Peer ${peerId} requested flowchart data for key: ${message.flowchartKey}`);
        
        // Send the current flowchart state if we have it and the key matches
        if (this.hypercoreKey === message.flowchartKey && this.connectedFlowchartId) {
          // Get the flowchart from Redux
          const state = store.getState();
          const flowchart = state.flowcharts.items[this.connectedFlowchartId];
          
          if (flowchart) {
            console.log(`Sending flowchart data to peer ${peerId}`);
            this.sendToPeer(peerId, {
              type: 'flowchart-data',
              flowchartKey: message.flowchartKey,
              data: {
                properties: { id: flowchart.id, name: flowchart.name },
                nodes: flowchart.nodes,
                edges: flowchart.edges
              }
            });
          } else {
            console.log(`No flowchart data available for key: ${message.flowchartKey}`);
          }
        }
      } else if (message.type === 'flowchart-data') {
        // Received full flowchart data
        console.log(`Received full flowchart data from peer ${peerId}`);
        
        // Remove from pending requests
        this.pendingDataRequests.delete(message.flowchartKey);
        
        // Notify YjsService about the complete flowchart update
        if (this.flowchartUpdateCallback) {
          this.flowchartUpdateCallback(message.data);
        }
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
      console.error('P2P messaging mechanism not available');
    }
  }
  
  // Clean up a peer connection
  private cleanupPeerConnection(peerId: string) {
    console.log(`Cleaning up connection to peer: ${peerId}`);
    
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
    console.log(`Simulating peer discovery for flowchart key: ${flowchartKey}`);
    
    // Simulate 1-3 peers
    const peerCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < peerCount; i++) {
      const peerId = `peer-${i}-${Math.random().toString(36).substring(2, 8)}`;
      
      setTimeout(() => {
        console.log(`Discovered peer via Hyperswarm: ${peerId}`);
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
    console.log('Sending flowchart update to all peers');
    
    const message = {
      type: 'flowchart-update',
      data: flowchartData,
      timestamp: Date.now()
    };
    
    // Send to all connected peers
    let sentToAnyPeer = false;
    this.dataChannels.forEach((dataChannel, peerId) => {
      if (dataChannel.readyState === 'open') {
        try {
          dataChannel.send(JSON.stringify(message));
          sentToAnyPeer = true;
          console.log(`Sent flowchart update to peer: ${peerId}`);
        } catch (error) {
          console.error(`Failed to send flowchart update to peer ${peerId}:`, error);
        }
      }
    });
    
    if (!sentToAnyPeer && this.dataChannels.size > 0) {
      console.warn('Could not send flowchart update to any peer - none are connected');
    } else if (this.dataChannels.size === 0) {
      console.log('No peers connected to send flowchart update to');
    }
  }
  
  // Send cursor position to all connected peers
  public sendCursorPosition(x: number, y: number) {
    const message = {
      type: 'cursor-position',
      x,
      y,
      timestamp: Date.now()
    };
    
    // Send to all connected peers
    this.dataChannels.forEach((dataChannel) => {
      if (dataChannel.readyState === 'open') {
        try {
          dataChannel.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send cursor position:', error);
        }
      }
    });
  }
  
  // Clean up all connections
  public cleanup() {
    console.log('Cleaning up WebRTC connections');
    
    // Clear any pending data requests
    this.pendingDataRequests.clear();
    
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
    this.connectionEstablished = false;
    this.connectedFlowchartId = null;
    
    // Update Redux store
    store.dispatch(setConnectionStatus(false));
    
    console.log('WebRTC connections cleaned up');
  }
}

// Create a singleton instance
const webRTCService = new WebRTCService();

export default webRTCService; 