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
import * as crypto from 'crypto-browserify';

// Generate real Hypercore-compatible keys
const generateHypercoreKey = () => {
  // Generate a 32-byte random key (compatible with Hypercore format)
  const key = new Uint8Array(32);
  window.crypto.getRandomValues(key);
  return Array.from(key)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// List of public WebSocket signaling servers for WebRTC
const SIGNALING_SERVERS = [
  'wss://signaling.yjs.dev',
  'wss://y-webrtc-signaling-eu.herokuapp.com',
  'wss://y-webrtc-signaling-us.herokuapp.com',
  'wss://demos.yjs.dev/ws'
];

// Configuration for WebRTC connections
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:openrelay.metered.ca:80' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

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
  private currentSignalingServerIndex: number = 0;
  private isReconnecting: boolean = false;
  
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
      
      // Set up direct P2P connection using WebRTC with signaling
      await this.initializeDirectP2P();
      
      return this.localPeerId;
    } catch (error) {
      console.error('Failed to initialize WebRTC service:', error);
      store.dispatch(setSignalingError('Failed to initialize WebRTC service'));
      throw error;
    }
  }

  // Initialize direct P2P connection using WebRTC with signaling
  private async initializeDirectP2P(): Promise<void> {
    try {
      console.log('Initializing direct P2P connection using WebRTC...');
      
      // Connect to signaling server for discovery and connection setup
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
        
        console.log(`Using existing key for flowchart ${flowchartId}: ${this.hypercoreKey}`);
        
        // Ensure we're connected to a signaling server
        if (!this.signalingServer || this.signalingServer.readyState !== WebSocket.OPEN) {
          console.warn('Not connected to signaling server, attempting to reconnect...');
          try {
            await this.initializeDirectP2P();
          } catch (error) {
            console.error('Failed to reconnect to signaling server:', error);
            throw error;
          }
        }
        
        // Announce this flowchart in the WebRTC network
        this.signalingServer.send(JSON.stringify({
          type: 'announce',
          topic: this.hypercoreKey,
          peerId: this.localPeerId
        }));
        console.log(`Announced existing flowchart with key ${this.hypercoreKey} in the network`);
        
        // Track the currently connected flowchart ID
        this.connectedFlowchartId = flowchartId;
        
        return this.hypercoreKey;
      }
      
      // Generate a new key for this flowchart
      this.hypercoreKey = generateHypercoreKey();
      
      // Store the association between flowchart ID and its key
      this.flowchartKeys.set(flowchartId, this.hypercoreKey);
      
      // Track the currently connected flowchart ID
      this.connectedFlowchartId = flowchartId;
      
      // Save to localStorage for persistence
      this.saveStoredKeys();
      
      // Set the active flowchart key in Redux
      store.dispatch(setActiveFlowchartKey(this.hypercoreKey));
      
      console.log(`Created new key for flowchart ${flowchartId}: ${this.hypercoreKey}`);
      
      // Ensure we're connected to a signaling server
      if (!this.signalingServer || this.signalingServer.readyState !== WebSocket.OPEN) {
        console.warn('Not connected to signaling server, attempting to reconnect...');
        await this.initializeDirectP2P();
      }
      
      // Announce this flowchart in the WebRTC network
      this.signalingServer.send(JSON.stringify({
        type: 'announce',
        topic: this.hypercoreKey,
        peerId: this.localPeerId
      }));
      console.log(`Announced new flowchart with key ${this.hypercoreKey} in the network`);
      
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
      console.log(`Joining flowchart with key: ${hypercoreKey}`);
      
      // First, cleanup any existing connections for other flowcharts
      if (this.hypercoreKey && this.hypercoreKey !== hypercoreKey) {
        console.log(`Cleaning up connections from previous flowchart ${this.hypercoreKey}`);
        this.cleanup();
      }
      
      // Set the new key
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
      
      // Ensure we're connected to the signaling server
      if (!this.signalingServer || this.signalingServer.readyState !== WebSocket.OPEN) {
        console.log('Not connected to signaling server, attempting to connect...');
        await this.initializeDirectP2P();
      }
      
      // Mark this flowchart key as pending a data request
      this.pendingDataRequests.add(hypercoreKey);
      
      // Set connection status to connecting
      store.dispatch(setConnectionStatus(true));
      
      // Broadcast discovery message to find peers with this key
      this.signalingServer.send(JSON.stringify({
        type: 'discover',
        topic: hypercoreKey,
        peerId: this.localPeerId
      }));
      console.log(`Broadcasting discovery message for flowchart key: ${hypercoreKey}`);
      
      return true;
    } catch (error) {
      console.error('Failed to join shared flowchart:', error);
      store.dispatch(setSignalingError('Failed to join shared flowchart'));
      return false;
    }
  }
  
  // Connect to the signaling server for WebRTC connections
  private async connectToSignalingServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // If we're already trying to reconnect, wait for that process to complete
        if (this.isReconnecting) {
          console.log('Already attempting to reconnect to a signaling server');
          return resolve();
        }
        
        this.isReconnecting = true;
        
        const tryConnectToServer = (serverIndex: number) => {
          if (serverIndex >= SIGNALING_SERVERS.length) {
            console.error('Failed to connect to any signaling server');
            this.isReconnecting = false;
            return reject(new Error('Failed to connect to any signaling server'));
          }
          
          const signalServerUrl = SIGNALING_SERVERS[serverIndex];
          console.log(`Attempting to connect to signaling server: ${signalServerUrl}`);
          
          // Clean up existing connection if any
          if (this.signalingServer) {
            this.signalingServer.onopen = null;
            this.signalingServer.onerror = null;
            this.signalingServer.onclose = null;
            this.signalingServer.onmessage = null;
            try {
              this.signalingServer.close();
            } catch (e) {
              // Ignore errors from closing
            }
          }
          
          // Create new WebSocket connection
          const ws = new WebSocket(signalServerUrl);
            
          // Set timeout to handle connection failures
          const connectionTimeout = setTimeout(() => {
            console.log(`Connection to ${signalServerUrl} timed out`);
            ws.onopen = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.onmessage = null;
            try {
              ws.close();
            } catch (e) {
              // Ignore errors from closing
            }
            
            // Try next server
            tryConnectToServer(serverIndex + 1);
          }, 5000);
          
          ws.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log(`Successfully connected to signaling server: ${signalServerUrl}`);
            
            // Update current server index
            this.currentSignalingServerIndex = serverIndex;
            this.signalingServer = ws;
            this.isReconnecting = false;
            
            // Identify ourselves with our peer ID
            if (this.localPeerId) {
              this.signalingServer.send(JSON.stringify({
                type: 'register',
                peerId: this.localPeerId
              }));
            }
            
            // Set up message handlers
            this.setupSignalingServerHandlers();
            
            resolve();
          };
          
          ws.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.error(`Signaling server connection error (${signalServerUrl}):`, error);
            
            // Try next server
            tryConnectToServer(serverIndex + 1);
          };
        };
        
        // Start with the current server index
        tryConnectToServer(this.currentSignalingServerIndex);
      } catch (error) {
        console.error('Failed to connect to signaling server:', error);
        this.isReconnecting = false;
        reject(error);
      }
    });
  }
  
  // Set up message handlers for the signaling server
  private setupSignalingServerHandlers(): void {
    if (!this.signalingServer) return;
    
    this.signalingServer.onclose = () => {
      console.log('Signaling server connection closed');
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (!this.isReconnecting) {
          console.log('Attempting to reconnect to signaling server...');
          this.connectToSignalingServer().catch(err => {
            console.error('Failed to reconnect to signaling server:', err);
            store.dispatch(setConnectionStatus(false));
          });
        }
      }, 5000);
      
      store.dispatch(setConnectionStatus(false));
    };
    
    this.signalingServer.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received signal:', message.type);
        
        // Process messages from the signaling server
        this.onSignalingMessage(message);
      } catch (error) {
        console.error('Error handling signaling message:', error);
      }
    };
  }
  
  // Handle incoming signaling messages
  private onSignalingMessage = (message: any) => {
    try {
      // Log all incoming messages for debugging
      console.log(`Received signal: ${message.type} from ${message.source || 'server'}`);
      
      // If the message has a topic field, verify it matches our hypercore key
      if (message.topic && this.hypercoreKey && message.topic !== this.hypercoreKey) {
        console.log(`Ignoring message for different topic: ${message.topic} (ours: ${this.hypercoreKey})`);
        return;
      }
      
      // Process based on message type
      if (message.type === 'discover-response' && message.peers && Array.isArray(message.peers)) {
        // We've received a list of peers interested in our topic
        console.log(`Discovered ${message.peers.length} peers for topic ${message.topic}`);
        
        // Connect to each peer
        message.peers.forEach((peerId: string) => {
          if (peerId !== this.localPeerId) {
            console.log(`Initiating connection to peer ${peerId}`);
            this.connectToPeer(peerId);
          }
        });
      }
      else if (message.type === 'peer-joined' && message.peerId && message.topic === this.hypercoreKey) {
        // A new peer has joined our topic
        console.log(`Peer ${message.peerId} joined our flowchart topic`);
        this.handlePeerJoined(message.peerId, message.peerInfo || {}, message.topic);
      }
      else if (message.type === 'offer' && message.target === this.localPeerId) {
        // We've received a WebRTC offer from a peer
        this.handleRemoteOffer(message.source, message.offer, message.topic);
      } 
      else if (message.type === 'answer' && message.target === this.localPeerId) {
        // We've received a WebRTC answer from a peer
        this.handleRemoteAnswer(message.source, message.answer, message.topic);
      } 
      else if (message.type === 'ice-candidate' && message.target === this.localPeerId) {
        // We've received an ICE candidate from a peer
        this.handleRemoteICECandidate(message.source, message.candidate, message.topic);
      }
      else if (message.type === 'error') {
        console.error('Signaling server error:', message.error);
        store.dispatch(setSignalingError(message.error));
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
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
      console.log(`Initiating WebRTC connection to peer: ${peerId}`);
      
      // Skip if we already have a connection to this peer
      if (this.peerConnections.has(peerId)) {
        console.log(`Connection to peer ${peerId} already exists`);
        return;
      }
      
      // Create a new RTCPeerConnection with ICE server configuration
      const peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10
      });
      
      // Store the connection
      this.peerConnections.set(peerId, peerConnection);
      
      // Create a data channel with a specific label for the flowchart
      const channelLabel = this.hypercoreKey ? 
        `flowchart-data-${this.hypercoreKey.substring(0, 8)}` : 
        'flowchart-data';
      
      console.log(`Creating data channel ${channelLabel} for peer ${peerId}`);
      const dataChannel = peerConnection.createDataChannel(channelLabel, {
        ordered: true
      });
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
      
      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state with peer ${peerId} changed to: ${peerConnection.iceConnectionState}`);
        
        if (peerConnection.iceConnectionState === 'failed') {
          console.log(`ICE Connection with peer ${peerId} failed, attempting to restart ICE`);
          try {
            // Attempt to restart ICE
            peerConnection.restartIce();
          } catch (error) {
            console.error(`Failed to restart ICE for peer ${peerId}:`, error);
          }
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
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
        iceRestart: true
      });
      await peerConnection.setLocalDescription(offer);
      
      // Send the offer via signaling server
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
          iceServers: ICE_SERVERS,
          iceCandidatePoolSize: 10
        });
        
        // Store the connection
        this.peerConnections.set(peerId, peerConnection);
        
        // Handle incoming data channels
        peerConnection.ondatachannel = (event) => {
          console.log(`Received data channel from peer ${peerId}: ${event.channel.label}`);
          this.setupDataChannel(peerId, event.channel);
        };
        
        // Handle ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
          console.log(`ICE connection state with peer ${peerId} changed to: ${peerConnection.iceConnectionState}`);
          
          if (peerConnection.iceConnectionState === 'failed') {
            console.log(`ICE Connection with peer ${peerId} failed, attempting to restart ICE`);
            try {
              // Attempt to restart ICE
              peerConnection.restartIce();
            } catch (error) {
              console.error(`Failed to restart ICE for peer ${peerId}:`, error);
            }
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
      
      // Send the answer via signaling server
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
            
            // Send the complete flowchart data
            const success = this.sendToPeer(peerId, {
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
            
            if (success) {
              console.log(`Successfully sent flowchart data to peer ${peerId}`);
              
              // Mark as connected
              this.connectionEstablished = true;
              store.dispatch(setConnectionStatus(true));
            } else {
              console.error(`Failed to send flowchart data to peer ${peerId}`);
            }
          } else {
            console.log(`No flowchart data available for key: ${message.flowchartKey}`);
          }
        } else {
          console.log(`Cannot provide flowchart data for requested key ${message.flowchartKey} (our key: ${this.hypercoreKey})`);
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
        if (message.flowchartKey) {
        this.pendingDataRequests.delete(message.flowchartKey);
          
          // If we don't have a hypercore key yet, adopt this one
          if (!this.hypercoreKey) {
            this.hypercoreKey = message.flowchartKey;
            
            // Create a temporary ID for this flowchart
            const tempFlowchartId = `shared-${message.flowchartKey.substring(0, 8)}`;
            this.flowchartKeys.set(tempFlowchartId, message.flowchartKey);
            this.connectedFlowchartId = tempFlowchartId;
            
            // Update Redux
            store.dispatch(setActiveFlowchartKey(message.flowchartKey));
          }
        }
        
        // Mark as connected
        this.connectionEstablished = true;
        store.dispatch(setConnectionStatus(true));
        
        // Notify YjsService about the complete flowchart update
        if (this.flowchartUpdateCallback) {
          // Make sure the data format is consistent
          const processedData = {
            properties: message.data.properties || { id: this.connectedFlowchartId },
            nodes: Array.isArray(message.data.nodes) ? message.data.nodes : [],
            edges: Array.isArray(message.data.edges) ? message.data.edges : []
          };
          
          console.log(`Passing flowchart data to YjsService:`, 
            `Nodes: ${processedData.nodes.length}, Edges: ${processedData.edges.length}`);
          
          this.flowchartUpdateCallback(processedData);
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
    if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
      this.signalingServer.send(JSON.stringify(message));
    } else {
      console.error('Signaling server not available');
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
  private discoverPeers(flowchartKey: string) {
    console.log(`Finding peers for flowchart key: ${flowchartKey}`);
    
    if (!this.signalingServer || this.signalingServer.readyState !== WebSocket.OPEN) {
      console.error('Signaling server not available');
      return;
    }
    
    // Store this as our active key if not already set
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
    
    // Send a discovery message to find peers connected to this flowchart
    this.signalingServer.send(JSON.stringify({
      type: 'discover',
      topic: flowchartKey,
      peerId: this.localPeerId
    }));
    
    console.log(`Sent discovery message for flowchart key: ${flowchartKey}`);
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
      try {
        dataChannel.close();
      } catch (e) {
        console.error('Error closing data channel:', e);
      }
    });
    
    this.peerConnections.forEach((peerConnection) => {
      try {
        peerConnection.close();
      } catch (e) {
        console.error('Error closing peer connection:', e);
      }
    });
    
    // Clear the maps
    this.dataChannels.clear();
    this.peerConnections.clear();
    
    // Close signaling connection
    if (this.signalingServer) {
      try {
        this.signalingServer.onopen = null;
        this.signalingServer.onerror = null;
        this.signalingServer.onclose = null;
        this.signalingServer.onmessage = null;
        this.signalingServer.close();
      } catch (e) {
        console.error('Error closing signaling connection:', e);
      }
      this.signalingServer = null;
    }
    
    // Reset state
    this.hypercoreKey = null;
    this.connectionEstablished = false;
    this.connectedFlowchartId = null;
    this.isReconnecting = false;
    
    // Update Redux store
    store.dispatch(setConnectionStatus(false));
    
    console.log('WebRTC connections cleaned up');
  }
}

// Create a singleton instance
const webRTCService = new WebRTCService();

export default webRTCService; 