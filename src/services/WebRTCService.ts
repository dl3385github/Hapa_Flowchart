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
import { HyperswarmBrowser, crypto } from '../polyfills';

// Generate a Hypercore key using crypto
const generateHypercoreKey = () => {
  // Generate a consistent key format similar to Hypercore
  const key = crypto.randomBytes(32);
  return key.toString('hex');
};

// Convert a hex string to a Buffer
const hexToBuffer = (hex: string): Buffer => {
  return Buffer.from(hex, 'hex');
};

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private localPeerId: string | null = null;
  private hypercoreKey: string | null = null;
  // Map to store flowchart IDs and their corresponding Hyperswarm keys
  private flowchartKeys: Map<string, string> = new Map();
  private flowchartUpdateCallback: ((data: any) => void) | null = null;
  private localUserInfo: any = null;
  private connectionEstablished: boolean = false;
  private pendingDataRequests: Set<string> = new Set(); // Track requested flowcharts
  private connectedFlowchartId: string | null = null;
  
  // Real Hyperswarm instance
  private swarm: HyperswarmBrowser | null = null;
  private activeTopics: Map<string, any> = new Map(); // Track active topic joinings
  
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
      
      // Initialize real Hyperswarm
      await this.connectToHyperswarm();
      
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
        
        // Join the topic with this key if we have an active swarm
        if (this.swarm) {
          const topicBuffer = hexToBuffer(this.hypercoreKey);
          const discovery = this.swarm.join(topicBuffer, { server: true, client: true });
          this.activeTopics.set(this.hypercoreKey, discovery);
          
          // Announce our presence
          await discovery.flushed();
          console.log(`Joined Hyperswarm topic for existing flowchart: ${this.hypercoreKey}`);
        }
        
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
      
      // Join the Hyperswarm network with this topic
      if (this.swarm) {
        const topicBuffer = hexToBuffer(this.hypercoreKey);
        const discovery = this.swarm.join(topicBuffer, { server: true, client: true });
        this.activeTopics.set(this.hypercoreKey, discovery);
        
        // Announce our presence
        await discovery.flushed();
        console.log(`Joined Hyperswarm topic for new flowchart: ${this.hypercoreKey}`);
      }
      
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
      
      // Join the Hyperswarm network with this topic
      if (this.swarm) {
        // Mark this flowchart key as pending a data request
        this.pendingDataRequests.add(hypercoreKey);
        
        // Convert the hex key to a Buffer for Hyperswarm
        const topicBuffer = hexToBuffer(hypercoreKey);
        
        // Leave any previously joined topics
        for (const [key, discovery] of this.activeTopics.entries()) {
          if (key !== hypercoreKey) {
            await this.swarm.leave(hexToBuffer(key));
            this.activeTopics.delete(key);
            console.log(`Left previous Hyperswarm topic: ${key}`);
          }
        }
        
        // Join the new topic
        const discovery = this.swarm.join(topicBuffer, { server: false, client: true });
        this.activeTopics.set(hypercoreKey, discovery);
        
        // Announce our presence
        await discovery.flushed();
        
        // Set connection status to connecting
        store.dispatch(setConnectionStatus(true));
        
        console.log(`Joined Hyperswarm topic for flowchart: ${hypercoreKey}`);
        return true;
      } else {
        console.error('Hyperswarm not initialized');
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
  
  // Connect to Hyperswarm network
  private async connectToHyperswarm(): Promise<void> {
    try {
      console.log('Connecting to Hyperswarm network...');
      
      // Create a real Hyperswarm instance
      this.swarm = new HyperswarmBrowser();
      
      // Set up connection handler
      this.swarm.on('connection', (conn, info) => {
        const remotePublicKey = info.publicKey.toString('hex');
        console.log(`New Hyperswarm connection from peer: ${remotePublicKey}`);
        
        // Treat the public key as the peer ID
        const peerId = remotePublicKey;
        
        // Add peer to our known peers
        this.handlePeerJoined(peerId, {
          name: `User-${peerId.substring(0, 6)}`,
          publicKey: remotePublicKey
        });
        
        // Set up message handling for this connection
        conn.on('data', (data: Buffer | string) => {
          try {
            const message = JSON.parse(typeof data === 'string' ? data : data.toString());
            console.log('Received message via Hyperswarm:', message.type);
            
            // Handle different message types
            this.onHyperswarmMessage(peerId, message);
          } catch (error) {
            console.error('Error processing Hyperswarm message:', error);
          }
        });
        
        // Handle connection close
        conn.on('close', () => {
          console.log(`Hyperswarm connection closed for peer: ${peerId}`);
          this.handlePeerLeft(peerId);
        });
        
        // If we have local user info, send it
        if (this.localUserInfo) {
          conn.write(JSON.stringify({
            type: 'user-info',
            source: this.localPeerId,
            info: this.localUserInfo,
            flowchartKey: this.hypercoreKey
          }));
        }
        
        // If we're currently connected to a flowchart, send that info
        if (this.hypercoreKey) {
          conn.write(JSON.stringify({
            type: 'active-flowchart',
            source: this.localPeerId,
            flowchartKey: this.hypercoreKey
          }));
          
          // If we're the host/source of the flowchart, send the current data
          if (this.connectedFlowchartId) {
            const state = store.getState();
            const flowchart = state.flowcharts.items[this.connectedFlowchartId];
            
            if (flowchart && flowchart.nodes && flowchart.edges) {
              console.log(`Sending current flowchart data to peer ${peerId}`);
              
              conn.write(JSON.stringify({
                type: 'flowchart-data',
                source: this.localPeerId,
                flowchartKey: this.hypercoreKey,
                data: {
                  properties: { 
                    id: flowchart.id, 
                    name: flowchart.name 
                  },
                  nodes: flowchart.nodes.filter(node => 
                    node && node.id && node.type && node.position
                  ),
                  edges: flowchart.edges.filter(edge => 
                    edge && edge.id && edge.source && edge.target
                  )
                }
              }));
            }
          }
        }
        
        // Initiate WebRTC connection if needed
        this.connectToPeer(peerId);
      });
      
      // Start listening
      await this.swarm.listen();
      console.log('Hyperswarm listening for connections');
      
    } catch (error) {
      console.error('Failed to connect to Hyperswarm network:', error);
      throw error;
    }
  }
  
  // Handle Hyperswarm message
  private onHyperswarmMessage(peerId: string, message: any): void {
    try {
      // Verify the flowchart key if provided
      if (message.flowchartKey && this.hypercoreKey && message.flowchartKey !== this.hypercoreKey) {
        console.log(`Ignoring message for different flowchart: ${message.flowchartKey} (ours: ${this.hypercoreKey})`);
        return;
      }
      
      // Handle different message types
      if (message.type === 'user-info') {
        store.dispatch(updatePeer({
          peerId,
          info: message.info
        }));
      } 
      else if (message.type === 'active-flowchart') {
        console.log(`Peer ${peerId} is working on flowchart: ${message.flowchartKey}`);
        
        // If we're waiting for this flowchart's data, request it
        if (this.pendingDataRequests.has(message.flowchartKey)) {
          this.sendToHyperswarmPeer(peerId, {
            type: 'request-flowchart',
            source: this.localPeerId,
            flowchartKey: message.flowchartKey
          });
        }
      }
      else if (message.type === 'request-flowchart') {
        // Peer is requesting flowchart data
        console.log(`Peer ${peerId} requested flowchart data for key: ${message.flowchartKey}`);
        
        // Send the current flowchart state if we have it
        if (this.hypercoreKey === message.flowchartKey && this.connectedFlowchartId) {
          const state = store.getState();
          const flowchart = state.flowcharts.items[this.connectedFlowchartId];
          
          if (flowchart && flowchart.nodes && flowchart.edges) {
            this.sendToHyperswarmPeer(peerId, {
              type: 'flowchart-data',
              source: this.localPeerId,
              flowchartKey: message.flowchartKey,
              data: {
                properties: { 
                  id: flowchart.id, 
                  name: flowchart.name 
                },
                nodes: flowchart.nodes.filter(node => 
                  node && node.id && node.type && node.position
                ),
                edges: flowchart.edges.filter(edge => 
                  edge && edge.id && edge.source && edge.target
                )
              }
            });
          }
        }
      }
      else if (message.type === 'flowchart-data') {
        // Received full flowchart data
        console.log(`Received full flowchart data from peer ${peerId}`, 
          `Nodes: ${message.data?.nodes?.length || 0}, Edges: ${message.data?.edges?.length || 0}`);
        
        // Validate the received data
        if (!message.data || !message.data.nodes || !message.data.edges) {
          console.error('Received invalid flowchart data from peer:', message.data);
          return;
        }
        
        // Remove from pending requests
        this.pendingDataRequests.delete(message.flowchartKey);
        
        // Notify YjsService about the complete flowchart update
        if (this.flowchartUpdateCallback) {
          this.flowchartUpdateCallback(message.data);
        }
      }
      // Handle WebRTC signaling messages
      else if (['offer', 'answer', 'ice-candidate'].includes(message.type)) {
        this.onSignalingMessage(message);
      }
    } catch (error) {
      console.error('Error handling Hyperswarm message:', error);
    }
  }
  
  // Send a message to a peer via Hyperswarm
  private sendToHyperswarmPeer(peerId: string, message: any): void {
    try {
      if (this.swarm) {
        // Find the connection to this peer
        const connections = Array.from(this.swarm.connections);
        const connection = connections.find(conn => {
          // Cast connection to any to access remotePublicKey property
          const anyConn = conn as any;
          return anyConn.remotePublicKey && anyConn.remotePublicKey.toString('hex') === peerId;
        });
        
        if (connection) {
          connection.write(JSON.stringify(message));
        } else {
          console.warn(`No Hyperswarm connection found for peer: ${peerId}`);
        }
      }
    } catch (error) {
      console.error(`Failed to send Hyperswarm message to peer ${peerId}:`, error);
    }
  }
  
  // Handle incoming signaling messages
  private onSignalingMessage = (message: any) => {
    try {
      // Log all incoming messages for debugging
      console.log(`Received signal: ${message.type} from ${message.source || 'unknown'}`);
      
      if (message.flowchartKey && this.hypercoreKey && message.flowchartKey !== this.hypercoreKey) {
        console.log(`Ignoring signaling message for different flowchart: ${message.flowchartKey} (ours: ${this.hypercoreKey})`);
        return;
      }
      
      if (message.type === 'offer' && message.target === this.localPeerId) {
        this.handleRemoteOffer(message.source, message.offer, message.flowchartKey);
      } 
      else if (message.type === 'answer' && message.target === this.localPeerId) {
        this.handleRemoteAnswer(message.source, message.answer, message.flowchartKey);
      } 
      else if (message.type === 'ice-candidate' && message.target === this.localPeerId) {
        this.handleRemoteICECandidate(message.source, message.candidate, message.flowchartKey);
      } 
      else if (message.type === 'peer-joined') {
        this.handlePeerJoined(message.peerId, message.peerInfo, message.flowchartKey);
      } 
      else if (message.type === 'peer-left') {
        this.handlePeerLeft(message.peerId);
      }
      else if (message.type === 'peer-discovered') {
        // Only process peer discovery if it's for our flowchart or we don't have one yet
        if (!message.flowchartKey || !this.hypercoreKey || message.flowchartKey === this.hypercoreKey) {
          console.log(`Discovered peer ${message.peerId} for flowchart ${message.flowchartKey || 'unknown'}`);
          this.handlePeerJoined(message.peerId, message.peerInfo, message.flowchartKey);
        } else {
          console.log(`Ignoring peer discovery for different flowchart: ${message.flowchartKey}`);
        }
      }
    } catch (error) {
      console.error('Error handling P2P message:', error);
    }
  };
  
  // Handle a new peer joining
  private handlePeerJoined(peerId: string, peerInfo: any, flowchartKey?: string) {
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
      
      // Skip if we already have a connection to this peer
      if (this.peerConnections.has(peerId)) {
        console.log(`Connection to peer ${peerId} already exists`);
        return;
      }
      
      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      
      // Store the connection
      this.peerConnections.set(peerId, peerConnection);
      
      // Create a data channel with a specific label for the flowchart
      const channelLabel = this.hypercoreKey ? 
        `flowchart-data-${this.hypercoreKey.substring(0, 8)}` : 
        'flowchart-data';
      
      console.log(`Creating data channel ${channelLabel} for peer ${peerId}`);
      const dataChannel = peerConnection.createDataChannel(channelLabel);
      this.setupDataChannel(peerId, dataChannel);
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignalingMessage({
            type: 'ice-candidate',
            source: this.localPeerId,
            target: peerId,
            candidate: event.candidate,
            flowchartKey: this.hypercoreKey // Include flowchart key with the ICE candidate
          });
        }
      };
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with peer ${peerId} changed to: ${peerConnection.connectionState}`);
        
        if (peerConnection.connectionState === 'connected') {
          console.log(`WebRTC connection with peer ${peerId} established`);
          this.connectionEstablished = true;
        } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
          console.log(`WebRTC connection with peer ${peerId} ${peerConnection.connectionState}`);
          this.cleanupPeerConnection(peerId);
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
        offer: peerConnection.localDescription,
        flowchartKey: this.hypercoreKey // Include flowchart key with the offer
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
  private async handleRemoteOffer(peerId: string, offer: RTCSessionDescriptionInit, flowchartKey?: string) {
    try {
      console.log(`Received WebRTC offer from peer: ${peerId}${flowchartKey ? ` for flowchart: ${flowchartKey}` : ''}`);
      
      // If we received a flowchart key with the offer, make sure we're connected to that flowchart
      if (flowchartKey && this.hypercoreKey !== flowchartKey) {
        console.log(`This offer is for flowchart ${flowchartKey}, but we're connected to ${this.hypercoreKey || 'none'}`);
        
        // If we're not connected to any flowchart, we can accept the connection
        // Otherwise, only accept if we're specifically connected to this flowchart
        if (this.hypercoreKey && this.hypercoreKey !== flowchartKey) {
          console.log(`Rejecting offer for different flowchart: ${flowchartKey}`);
          return;
        }
        
        // If we don't have a hypercoreKey yet, set it from the incoming offer
        if (!this.hypercoreKey) {
          this.hypercoreKey = flowchartKey;
          
          // Create a temporary ID for the joined flowchart
          const tempFlowchartId = `shared-${flowchartKey.substring(0, 8)}`;
          
          // Store the association and update Redux
          this.flowchartKeys.set(tempFlowchartId, flowchartKey);
          this.connectedFlowchartId = tempFlowchartId;
          this.saveStoredKeys();
          store.dispatch(setActiveFlowchartKey(flowchartKey));
          
          // We'll be requesting data for this flowchart
          this.pendingDataRequests.add(flowchartKey);
        }
      }
      
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
          console.log(`Received data channel from peer ${peerId}: ${event.channel.label}`);
          this.setupDataChannel(peerId, event.channel);
        };
        
        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          console.log(`Connection state with peer ${peerId} changed to: ${peerConnection.connectionState}`);
          
          if (peerConnection.connectionState === 'connected') {
            console.log(`WebRTC connection with peer ${peerId} established`);
            this.connectionEstablished = true;
          } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
            console.log(`WebRTC connection with peer ${peerId} ${peerConnection.connectionState}`);
            this.cleanupPeerConnection(peerId);
          }
        };
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.sendSignalingMessage({
              type: 'ice-candidate',
              source: this.localPeerId,
              target: peerId,
              candidate: event.candidate,
              flowchartKey: this.hypercoreKey // Include the flowchart key
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
        answer: peerConnection.localDescription,
        flowchartKey: this.hypercoreKey // Include the flowchart key
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
  private async handleRemoteAnswer(peerId: string, answer: RTCSessionDescriptionInit, flowchartKey?: string) {
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
  private async handleRemoteICECandidate(peerId: string, candidate: RTCIceCandidateInit, flowchartKey?: string) {
    try {
      const peerConnection = this.peerConnections.get(peerId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Failed to handle remote ICE candidate:', error);
    }
  }
  
  // Set up a data channel for a peer
  private setupDataChannel(peerId: string, dataChannel: RTCDataChannel) {
    console.log(`Setting up data channel for peer: ${peerId}, channel: ${dataChannel.label}`);
    this.dataChannels.set(peerId, dataChannel);
    
    dataChannel.onopen = () => {
      console.log(`Data channel to ${peerId} opened - P2P connection established`);
      
      // Send our user info
      if (this.localUserInfo) {
        this.sendToPeer(peerId, {
          type: 'user-info',
          info: this.localUserInfo
        });
      }
      
      // Update Redux store
      store.dispatch(setPeerConnection({
        peerId,
        connection: 'connected'
      }));
      
      // If we're sharing a flowchart, immediately inform the peer
      if (this.hypercoreKey && this.connectedFlowchartId) {
        console.log(`Informing peer ${peerId} about active flowchart: ${this.hypercoreKey}`);
        this.sendToPeer(peerId, {
          type: 'active-flowchart',
          flowchartKey: this.hypercoreKey
        });
        
        // If we're the host/source of the flowchart, send the current data
        const state = store.getState();
        if (this.connectedFlowchartId && state.flowcharts.items[this.connectedFlowchartId]) {
          const flowchart = state.flowcharts.items[this.connectedFlowchartId];
          console.log(`Sending current flowchart data to peer ${peerId}`);
          
          // Ensure we're sending valid data
          if (flowchart.nodes && flowchart.edges) {
            this.sendToPeer(peerId, {
              type: 'flowchart-data',
              flowchartKey: this.hypercoreKey,
              data: {
                properties: { 
                  id: flowchart.id, 
                  name: flowchart.name 
                },
                nodes: flowchart.nodes.filter(node => 
                  node && node.id && node.type && node.position
                ),
                edges: flowchart.edges.filter(edge => 
                  edge && edge.id && edge.source && edge.target
                )
              }
            });
          }
        }
      }
      
      // If we're joining and waiting for data, request it
      if (this.pendingDataRequests.has(this.hypercoreKey || '')) {
        console.log(`Requesting data for flowchart: ${this.hypercoreKey}`);
        this.sendToPeer(peerId, {
          type: 'request-flowchart',
          flowchartKey: this.hypercoreKey
        });
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
      
      // Verify the flowchart key if provided
      if (message.flowchartKey && this.hypercoreKey && message.flowchartKey !== this.hypercoreKey) {
        console.log(`Ignoring message for different flowchart: ${message.flowchartKey} (ours: ${this.hypercoreKey})`);
        return;
      }
      
      // Handle different message types
      if (message.type === 'flowchart-update') {
        // Notify YjsService about the update
        if (this.flowchartUpdateCallback) {
          console.log('Received flowchart update from peer:', message.data);
          this.flowchartUpdateCallback(message.data);
        }
      } 
      else if (message.type === 'user-info') {
        // Update peer info in Redux
        store.dispatch(updatePeer({
          peerId,
          info: message.info
        }));
        
        console.log(`Updated user info for peer ${peerId}:`, message.info);
      }
      else if (message.type === 'cursor-position') {
        // Update cursor position in Redux
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
      else if (message.type === 'active-flowchart') {
        console.log(`Peer ${peerId} is working on flowchart: ${message.flowchartKey}`);
        
        // If we're waiting for this flowchart's data, request it now
        if (this.pendingDataRequests.has(message.flowchartKey)) {
          console.log(`Requesting flowchart data for key: ${message.flowchartKey}`);
          this.sendToPeer(peerId, {
            type: 'request-flowchart',
            flowchartKey: message.flowchartKey
          });
        } else if (!this.hypercoreKey) {
          // If we don't have a hypercore key yet, adopt this one
          this.hypercoreKey = message.flowchartKey;
          console.log(`Adopting flowchart key from peer: ${this.hypercoreKey}`);
          
          // Create a temporary ID for this flowchart
          const tempFlowchartId = `shared-${message.flowchartKey.substring(0, 8)}`;
          this.flowchartKeys.set(tempFlowchartId, message.flowchartKey);
          this.connectedFlowchartId = tempFlowchartId;
          
          // Update Redux
          store.dispatch(setActiveFlowchartKey(message.flowchartKey));
          
          // Request flowchart data
          this.pendingDataRequests.add(message.flowchartKey);
          this.sendToPeer(peerId, {
            type: 'request-flowchart',
            flowchartKey: message.flowchartKey
          });
        }
      } 
      else if (message.type === 'request-flowchart') {
        // Peer is requesting flowchart data
        console.log(`Peer ${peerId} requested flowchart data for key: ${message.flowchartKey}`);
        
        // Send the current flowchart state if we have it and the key matches
        if (this.hypercoreKey === message.flowchartKey && this.connectedFlowchartId) {
          // Get the flowchart from Redux
          const state = store.getState();
          const flowchart = state.flowcharts.items[this.connectedFlowchartId];
          
          if (flowchart) {
            console.log(`Sending flowchart data to peer ${peerId}`, 
              `Nodes: ${flowchart.nodes.length}, Edges: ${flowchart.edges.length}`);
            
            // Ensure we're sending valid data
            const validNodes = flowchart.nodes.filter(node => 
              node && node.id && node.type && node.position
            );
            
            const validEdges = flowchart.edges.filter(edge => 
              edge && edge.id && edge.source && edge.target
            );
            
            this.sendToPeer(peerId, {
              type: 'flowchart-data',
              flowchartKey: message.flowchartKey,
              data: {
                properties: { 
                  id: flowchart.id, 
                  name: flowchart.name 
                },
                nodes: validNodes,
                edges: validEdges
              }
            });
          } else {
            console.log(`No flowchart data available for key: ${message.flowchartKey}`);
          }
        }
      } 
      else if (message.type === 'flowchart-data') {
        // Received full flowchart data
        console.log(`Received full flowchart data from peer ${peerId}`, 
          `Nodes: ${message.data?.nodes?.length || 0}, Edges: ${message.data?.edges?.length || 0}`);
        
        // Validate the received data
        if (!message.data || !message.data.nodes || !message.data.edges) {
          console.error('Received invalid flowchart data from peer:', message.data);
          return;
        }
        
        // Remove from pending requests
        this.pendingDataRequests.delete(message.flowchartKey);
        
        // If we don't have a hypercore key yet, adopt this one
        if (!this.hypercoreKey && message.flowchartKey) {
          this.hypercoreKey = message.flowchartKey;
          
          // Create a temporary ID for this flowchart
          const tempFlowchartId = `shared-${message.flowchartKey.substring(0, 8)}`;
          this.flowchartKeys.set(tempFlowchartId, message.flowchartKey);
          this.connectedFlowchartId = tempFlowchartId;
          
          // Update Redux
          store.dispatch(setActiveFlowchartKey(message.flowchartKey));
        }
        
        // Notify YjsService about the complete flowchart update
        if (this.flowchartUpdateCallback) {
          this.flowchartUpdateCallback(message.data);
        }
      }
      else if (message.type === 'node-operation') {
        // Handle node operations (move, delete, add)
        console.log(`Received node operation from peer ${peerId}:`, message.operation);
        
        if (this.flowchartUpdateCallback) {
          // Pass the operation to YjsService
          this.flowchartUpdateCallback({
            nodeOperation: message.operation
          });
        }
      }
      else if (message.type === 'edge-operation') {
        // Handle edge operations (create, delete)
        console.log(`Received edge operation from peer ${peerId}:`, message.operation);
        
        if (this.flowchartUpdateCallback) {
          // Pass the operation to YjsService
          this.flowchartUpdateCallback({
            edgeOperation: message.operation
          });
        }
      }
    } catch (error) {
      console.error('Failed to handle data channel message:', error);
    }
  }
  
  // Send a message through the signaling server
  private sendSignalingMessage(message: any) {
    if (this.swarm) {
      // With real Hyperswarm, we need to send the message to the specific peer
      if (message.target && message.source === this.localPeerId) {
        this.sendToHyperswarmPeer(message.target, message);
      }
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
  
  // Discover peers for a specific flowchart key
  private simulateDiscoveredPeers(flowchartKey: string) {
    console.log(`Finding peers for flowchart key: ${flowchartKey}`);
    
    // In a real implementation, this would use Hyperswarm's topic-based discovery
    // Here we're improving the simulation to better connect with specific peers
    
    if (!this.swarm) {
      console.error('P2P discovery network not available');
      return;
    }
    
    // Store this as our active hypercore key if not already set
    if (!this.hypercoreKey) {
      this.hypercoreKey = flowchartKey;
      
      // Create a temporary ID for this flowchart
      const tempFlowchartId = `shared-${flowchartKey.substring(0, 8)}`;
      this.flowchartKeys.set(tempFlowchartId, flowchartKey);
      this.connectedFlowchartId = tempFlowchartId;
      this.saveStoredKeys();
      
      // Update Redux
      store.dispatch(setActiveFlowchartKey(flowchartKey));
    }
    
    // This method is now replaced by proper Hyperswarm topic joining
    // Just log that we're using the real implementation
    console.log(`Using real Hyperswarm to join topic: ${flowchartKey}`);
    
    // Join the Hyperswarm network with this topic if not already joined
    if (!this.activeTopics.has(flowchartKey)) {
      const topicBuffer = hexToBuffer(flowchartKey);
      const discovery = this.swarm.join(topicBuffer, { server: true, client: true });
      this.activeTopics.set(flowchartKey, discovery);
      
      // Log that we've joined the topic
      console.log(`Joined Hyperswarm topic for flowchart: ${flowchartKey}`);
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
    if (this.swarm) {
      // this.swarm.close();
      this.swarm = null;
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