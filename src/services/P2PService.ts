import { EventEmitter } from 'events';
import { store } from '../store';
import { 
  setLocalPeerId, 
  setConnectionStatus, 
  setPeerConnection, 
  removePeerConnection, 
  updatePeer,
  setSignalingError,
  setActiveFlowchartKey,
  updatePeerCursor
} from '../store/slices/collaborationSlice';
import crypto from 'crypto';
import { Hyperswarm } from '../polyfills/bare-hyperswarm';
import { v4 as uuidv4 } from 'uuid';
import { generateRandomName, getColorFromId } from '../utils/nameGenerator';

// Configuration for WebRTC connections
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:stun.ekiga.net:3478' }
];

// Generate a random peer ID
const generatePeerId = (): string => {
  return uuidv4().replace(/-/g, '');
};

// Create a topic key from string input
const createTopicKey = (input: string): Uint8Array => {
  // Use crypto.subtle to create a consistent hash as Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // For now, just truncate the input to 32 bytes
  const result = new Uint8Array(32);
  for (let i = 0; i < Math.min(data.length, 32); i++) {
    result[i] = data[i];
  }
  
  return result;
};

export class P2PService extends EventEmitter {
  private swarm: any = null;
  private localPeerId: string | null = null;
  private activeFlowchartKey: string | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private pendingIceCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private flowchartKeys: Map<string, string> = new Map();
  private localUserInfo: any = null;
  private flowchartUpdateCallback: ((data: any) => void) | null = null;
  
  constructor() {
    super();
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
  
  /**
   * Initialize the P2P service
   * @returns The local peer ID
   */
  public async initialize(): Promise<string> {
    try {
      if (!this.localPeerId) {
        this.localPeerId = generatePeerId();
        store.dispatch(setLocalPeerId(this.localPeerId));
      }
      
      console.log('P2P Service initialized with peer ID:', this.localPeerId);
      
      return this.localPeerId;
    } catch (error) {
      console.error('Failed to initialize P2P service:', error);
      store.dispatch(setSignalingError('Failed to initialize P2P service'));
      throw error;
    }
  }
  
  /**
   * Create a shared flowchart that others can join
   * @param flowchartId The ID of the flowchart to share
   * @returns A key that can be shared with others
   */
  public async createSharedFlowchart(flowchartId: string): Promise<string> {
    try {
      console.log(`Creating shared flowchart with ID: ${flowchartId}`);
      
      // If we already have a key for this flowchart and it's active, return it
      if (this.activeFlowchartKey && this.flowchartKeys.get(flowchartId) === this.activeFlowchartKey) {
        console.log(`Already connected to flowchart with key: ${this.activeFlowchartKey}`);
        return this.activeFlowchartKey;
      }
      
      // Generate a unique key for this flowchart if we don't already have one
      let key = this.flowchartKeys.get(flowchartId);
      if (!key) {
        // Create a new random key
        key = generatePeerId();
        this.flowchartKeys.set(flowchartId, key);
        this.saveStoredKeys();
        console.log(`Generated new key for flowchart ${flowchartId}: ${key}`);
      }
      
      // Join the swarm for this key
      await this.joinSwarm(key);
      
      // Set as active flowchart key
      this.activeFlowchartKey = key;
      store.dispatch(setActiveFlowchartKey(key));
      
      return key;
    } catch (error) {
      console.error('Error creating shared flowchart:', error);
      throw error;
    }
  }
  
  /**
   * Join a shared flowchart using a key
   * @param key The key of the flowchart to join
   * @returns True if successful
   */
  public async joinSharedFlowchart(key: string): Promise<boolean> {
    try {
      console.log(`Joining shared flowchart with key: ${key}`);
      
      // If we're already connected to this key, don't reconnect
      if (this.activeFlowchartKey === key) {
        console.log(`Already connected to flowchart with key: ${key}`);
        return true;
      }
      
      // Join the swarm for this key
      await this.joinSwarm(key);
      
      // Set as active flowchart
      this.activeFlowchartKey = key;
      store.dispatch(setActiveFlowchartKey(key));
      
      return true;
    } catch (error) {
      console.error('Error joining shared flowchart:', error);
      throw error;
    }
  }
  
  /**
   * Join a Hyperswarm for a given topic key
   * @param key The topic key to join
   */
  private async joinSwarm(key: string): Promise<void> {
    try {
      console.log(`Joining swarm with key: ${key}`);
      
      // If we're already connected to this key, don't rejoin
      if (this.swarm && this.activeFlowchartKey === key) {
        console.log(`Already connected to swarm for key: ${key}`);
        return;
      }
      
      // Leave any existing swarm
      await this.leaveSwarm();
      
      // Create a new Hyperswarm instance using our polyfill
      this.swarm = new Hyperswarm({
        // Pass necessary config
        multiplexing: true,
        maxPeers: 50
      });
      
      // Explicitly set event handlers for error handling
      this.swarm.on('error', (err: Error) => {
        console.error('Swarm error:', err);
        this.emit('error', err);
      });
      
      // Set up connection handler before joining
      this.swarm.on('connection', (conn: any, info: any) => {
        this.handleSwarmConnection(conn, info);
      });
      
      // Set up disconnection handler
      this.swarm.on('disconnection', (conn: any, info: any) => {
        this.handleSwarmDisconnection(conn, info);
      });
      
      // Create a topic from the key
      const topic = createTopicKey(key);
      const topicHex = Buffer.from(topic).toString('hex');
      console.log(`Created topic: ${topicHex}`);
      
      // Join the topic
      const discovery = this.swarm.join(topic, { server: true, client: true });
      
      // Wait for discovery
      try {
        await discovery.flushed();
        console.log(`Successfully flushed discovery for key: ${key}`);
      } catch (err) {
        console.warn(`Discovery flush error (non-fatal): ${err.message}`);
      }
      
      // Save the active key
      this.activeFlowchartKey = key;
      store.dispatch(setActiveFlowchartKey(key));
      store.dispatch(setConnectionStatus(true));
      
      console.log(`Successfully joined swarm for key: ${key}`);
    } catch (error) {
      console.error('Error joining swarm:', error);
      store.dispatch(setSignalingError('Failed to join swarm: ' + error.message));
      throw error;
    }
  }
  
  /**
   * Leave the current swarm
   */
  private async leaveSwarm(): Promise<void> {
    if (!this.swarm) return;
    
    try {
      console.log('Leaving current swarm...');
      
      // Close all connections
      await this.cleanup();
      
      // Destroy the swarm
      await this.swarm.destroy();
      this.swarm = null;
      
      // Clear active key
      this.activeFlowchartKey = null;
      store.dispatch(setActiveFlowchartKey(null));
      store.dispatch(setConnectionStatus(false));
      
      console.log('Successfully left swarm');
    } catch (error) {
      console.error('Error leaving swarm:', error);
    }
  }
  
  /**
   * Handle a new connection from the Hyperswarm
   * @param conn The connection
   * @param info Connection info
   */
  private handleSwarmConnection(conn: any, info: any): void {
    try {
      // Generate a peer ID for this connection based on info
      const remotePeerId = info.publicKey.toString('hex');
      console.log(`New peer connected: ${remotePeerId.slice(0, 6)}, ${info.shouldInitiate ? 'we will' : 'they will'} initiate`);
      
      // Set up the WebRTC connection
      this.setupWebRTC(remotePeerId, conn, info.shouldInitiate);
      
      // Update the Redux store
      store.dispatch(setPeerConnection({
        peerId: remotePeerId,
        connection: 'connecting'
      }));
      
      store.dispatch(updatePeer({
        peerId: remotePeerId,
        info: {
          peerId: remotePeerId,
          name: `Peer ${remotePeerId.slice(0, 6)}`,
          lastSeen: new Date().toISOString()
        }
      }));
      
      // Set up data handler for signaling
      conn.on('data', (data: Buffer) => {
        this.handleSignalingData(remotePeerId, data);
      });
    } catch (error) {
      console.error('Error handling new connection:', error);
    }
  }
  
  /**
   * Handle signaling data received from the swarm connection
   * @param peerId Remote peer ID
   * @param data The signaling data
   */
  private handleSignalingData(peerId: string, data: Buffer): void {
    try {
      const signal = JSON.parse(data.toString());
      console.log(`Received signal from peer ${peerId.slice(0, 6)}:`, signal.type);
      
      // Pass to the appropriate WebRTC signaling handler
      this.handleSignalReceived(peerId, signal);
    } catch (error) {
      console.error(`Error handling signaling data from peer ${peerId}:`, error);
    }
  }
  
  /**
   * Handle a disconnection from the Hyperswarm
   * @param conn The connection
   * @param info Connection info
   */
  private handleSwarmDisconnection(conn: any, info: any): void {
    try {
      const remotePeerId = info.publicKey.toString('hex');
      console.log(`Peer disconnected: ${remotePeerId}`);
      
      // Clean up WebRTC connection
      this.cleanupPeerConnection(remotePeerId);
      
      // Update Redux store
      store.dispatch(removePeerConnection(remotePeerId));
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  }
  
  /**
   * Set up WebRTC connection with a peer
   * @param peerId The peer ID
   * @param swarmConn The swarm connection for signaling
   * @param shouldInitiate Whether we should initiate the connection
   */
  private async setupWebRTC(peerId: string, swarmConn: any, shouldInitiate: boolean): Promise<void> {
    try {
      console.log(`Setting up WebRTC with peer: ${peerId.slice(0, 6)}, ${shouldInitiate ? 'initiating' : 'waiting'}`);
      
      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS
      });
      
      // Store the connection
      this.peerConnections.set(peerId, peerConnection);
      
      // Set up ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`Sending ICE candidate to peer: ${peerId.slice(0, 6)}`);
          const signalData = {
            type: 'ice-candidate',
            candidate: event.candidate
          };
          swarmConn.write(Buffer.from(JSON.stringify(signalData)));
        }
      };
      
      // Track connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`WebRTC connection state with ${peerId.slice(0, 6)}: ${peerConnection.connectionState}`);
        
        if (peerConnection.connectionState === 'connected') {
          store.dispatch(setPeerConnection({
            peerId,
            connection: 'connected'
          }));
        } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
          this.cleanupPeerConnection(peerId);
          store.dispatch(setPeerConnection({
            peerId,
            connection: 'disconnected'
          }));
        }
      };
      
      if (shouldInitiate) {
        // Create a data channel if we're the initiator
        const dataChannel = peerConnection.createDataChannel(`flowchart-${peerId.slice(0, 6)}`, {
          ordered: true
        });
        
        // Set up data channel event handlers
        this.setupDataChannel(peerId, dataChannel);
        
        try {
          // Create and send offer
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          console.log(`Sending offer to peer: ${peerId.slice(0, 6)}`);
          swarmConn.write(Buffer.from(JSON.stringify({
            type: 'offer',
            sdp: peerConnection.localDescription
          })));
        } catch (err) {
          console.error(`Error creating offer for peer ${peerId.slice(0, 6)}:`, err);
        }
      } else {
        // If we're not initiating, just set up ondatachannel handler
        peerConnection.ondatachannel = (event) => {
          console.log(`Received data channel from peer: ${peerId.slice(0, 6)}`);
          this.setupDataChannel(peerId, event.channel);
        };
      }
    } catch (error) {
      console.error(`Error setting up WebRTC with peer ${peerId.slice(0, 6)}:`, error);
    }
  }
  
  /**
   * Set up data channel event handlers
   * @param peerId The peer ID
   * @param dataChannel The RTCDataChannel
   */
  private setupDataChannel(peerId: string, dataChannel: RTCDataChannel): void {
    // Store data channel reference
    dataChannel.onopen = () => {
      console.log(`Data channel open with peer: ${peerId.slice(0, 6)}`);
      this.dataChannels.set(peerId, dataChannel);
      
      // Update Redux store
      store.dispatch(setPeerConnection({
        peerId,
        connection: 'connected'
      }));
      
      // Send local user info
      if (this.localUserInfo) {
        this.sendToPeer(peerId, {
          type: 'user-info',
          info: this.localUserInfo
        });
      }
    };
    
    dataChannel.onclose = () => {
      console.log(`Data channel closed with peer: ${peerId.slice(0, 6)}`);
      this.dataChannels.delete(peerId);
      
      // Update Redux store
      store.dispatch(setPeerConnection({
        peerId,
        connection: 'disconnected'
      }));
    };
    
    dataChannel.onerror = (error) => {
      console.error(`Data channel error with peer ${peerId.slice(0, 6)}:`, error);
    };
    
    dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(peerId, event.data);
    };
  }
  
  /**
   * Handle a WebRTC signal received from a peer
   * @param peerId The peer ID
   * @param signal The signal data
   */
  private async handleSignalReceived(peerId: string, signal: any): Promise<void> {
    try {
      // Get or create the peer connection
      let peerConnection = this.peerConnections.get(peerId);
      
      if (!peerConnection) {
        console.warn(`Received signal for unknown peer ${peerId.slice(0, 6)}, creating new connection`);
        
        // Create a new connection
        peerConnection = new RTCPeerConnection({
          iceServers: ICE_SERVERS
        });
        
        // Set up ICE candidate handler
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`Generated ICE candidate for peer: ${peerId.slice(0, 6)}`);
            // We would send this via the signaling channel, but we may not have one yet
            // Store for later use if needed
            if (!this.pendingIceCandidates.has(peerId)) {
              this.pendingIceCandidates.set(peerId, []);
            }
            this.pendingIceCandidates.get(peerId)?.push(event.candidate);
          }
        };
        
        // Set up connection state tracking
        peerConnection.onconnectionstatechange = () => {
          console.log(`WebRTC connection state with ${peerId.slice(0, 6)}: ${peerConnection?.connectionState}`);
          
          if (peerConnection?.connectionState === 'connected') {
            store.dispatch(setPeerConnection({
              peerId,
              connection: 'connected'
            }));
          } else if (['disconnected', 'failed', 'closed'].includes(peerConnection?.connectionState || '')) {
            this.cleanupPeerConnection(peerId);
            store.dispatch(setPeerConnection({
              peerId,
              connection: 'disconnected'
            }));
          }
        };
        
        // Handle incoming data channels
        peerConnection.ondatachannel = (event) => {
          console.log(`Received data channel from peer: ${peerId.slice(0, 6)}`);
          this.setupDataChannel(peerId, event.channel);
        };
        
        // Store the connection
        this.peerConnections.set(peerId, peerConnection);
      }
      
      // Handle different signal types
      switch (signal.type) {
        case 'offer':
          console.log(`Processing offer from peer: ${peerId.slice(0, 6)}`);
          
          // Set the remote description
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          
          // Create an answer
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          // Send the answer back through the signaling channel
          if (this.swarm) {
            const conn = this.swarm.connections.get(peerId);
            if (conn) {
              console.log(`Sending answer to peer: ${peerId.slice(0, 6)}`);
              conn.write(Buffer.from(JSON.stringify({
                type: 'answer',
                sdp: peerConnection.localDescription
              })));
            } else {
              console.error(`No signaling connection found for peer: ${peerId.slice(0, 6)}`);
            }
          }
          
          // Process any pending ICE candidates
          await this.processPendingIceCandidates(peerId, peerConnection);
          break;
          
        case 'answer':
          console.log(`Processing answer from peer: ${peerId.slice(0, 6)}`);
          
          // Set the remote description
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          
          // Process any pending ICE candidates
          await this.processPendingIceCandidates(peerId, peerConnection);
          break;
          
        case 'ice-candidate':
          console.log(`Received ICE candidate from peer: ${peerId.slice(0, 6)}`);
          
          // If connection is not yet fully established, queue the candidate
          if (!peerConnection.remoteDescription) {
            if (!this.pendingIceCandidates.has(peerId)) {
              this.pendingIceCandidates.set(peerId, []);
            }
            this.pendingIceCandidates.get(peerId)?.push(signal.candidate);
          } else {
            // Otherwise add it immediately
            await this.addIceCandidate(peerId, peerConnection, signal.candidate);
          }
          break;
          
        default:
          console.warn(`Unknown signal type from peer ${peerId.slice(0, 6)}:`, signal.type);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error handling signal from peer ${peerId}:`, error.message);
      } else {
        console.error(`Unknown error handling signal from peer ${peerId}`);
      }
    }
  }
  
  /**
   * Process any pending ICE candidates for a peer
   * @param peerId Peer ID
   * @param peerConnection RTCPeerConnection
   */
  private async processPendingIceCandidates(peerId: string, peerConnection: RTCPeerConnection): Promise<void> {
    if (!this.pendingIceCandidates.has(peerId)) return;
    
    const candidates = this.pendingIceCandidates.get(peerId)!;
    console.log(`Processing ${candidates.length} pending ICE candidates for peer ${peerId}`);
    
    for (const candidate of candidates) {
      await this.addIceCandidate(peerId, peerConnection, candidate);
    }
    
    // Clear the pending candidates
    this.pendingIceCandidates.delete(peerId);
  }
  
  /**
   * Add an ICE candidate to a peer connection
   * @param peerId Peer ID
   * @param peerConnection RTCPeerConnection
   * @param candidate ICE candidate
   */
  private async addIceCandidate(peerId: string, peerConnection: RTCPeerConnection, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`Added ICE candidate for peer ${peerId}`);
    } catch (error) {
      console.error(`Error adding ICE candidate for peer ${peerId}:`, error);
    }
  }
  
  /**
   * Handle a message received via data channel
   * @param peerId Peer ID
   * @param rawData Message data
   */
  private handleDataChannelMessage(peerId: string, rawData: string): void {
    try {
      // Parse the message
      const data = JSON.parse(rawData);
      console.log(`Received message from peer ${peerId}:`, data.type);
      
      // Handle different message types
      switch (data.type) {
        case 'user-info':
          this.handleUserInfo(peerId, data);
          break;
        case 'flowchart-update':
          this.handleFlowchartUpdate(peerId, data);
          break;
        case 'cursor-position':
          this.handleCursorPosition(peerId, data);
          break;
        default:
          console.warn(`Unknown message type from peer ${peerId}:`, data.type);
      }
    } catch (error) {
      console.error(`Error handling message from peer ${peerId}:`, error);
    }
  }
  
  /**
   * Handle user info from a peer
   * @param peerId Peer ID
   * @param data Message data
   */
  private handleUserInfo(peerId: string, data: any): void {
    console.log(`Received user info from peer ${peerId}:`, data.info);
    
    // Update the peer's info in the store
    store.dispatch(updatePeer({
      peerId,
      info: {
        ...data.info,
        lastSeen: new Date().toISOString()
      }
    }));
  }
  
  /**
   * Handle flowchart update from a peer
   * @param peerId Peer ID
   * @param data Message data
   */
  private handleFlowchartUpdate(peerId: string, data: any): void {
    console.log(`Received flowchart update from peer ${peerId}`);
    
    // Pass to callback if registered
    if (this.flowchartUpdateCallback) {
      this.flowchartUpdateCallback(data);
    }
  }
  
  /**
   * Handle cursor position update from a peer
   * @param peerId Peer ID
   * @param data Message data
   */
  private handleCursorPosition(peerId: string, data: any): void {
    // Update the peer's cursor position in the store
    store.dispatch(updatePeerCursor({
      peerId,
      x: data.x,
      y: data.y
    }));
  }
  
  /**
   * Send data to a specific peer
   * @param peerId Peer ID
   * @param data Data to send
   * @returns True if sent successfully
   */
  private sendToPeer(peerId: string, data: any): boolean {
    try {
      if (!this.dataChannels.has(peerId)) {
        console.warn(`No data channel for peer ${peerId}`);
        return false;
      }
      
      const dataChannel = this.dataChannels.get(peerId)!;
      
      if (dataChannel.readyState !== 'open') {
        console.warn(`Data channel for peer ${peerId} is not open`);
        return false;
      }
      
      dataChannel.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error sending to peer ${peerId}:`, error);
      return false;
    }
  }
  
  /**
   * Determine if we should initiate the WebRTC connection
   * @param peerId Peer ID
   * @returns True if we should initiate
   */
  private shouldInitiateConnection(peerId: string): boolean {
    // Compare our peer ID with the remote peer ID lexicographically
    // This ensures only one side initiates the connection
    if (!this.localPeerId) return false;
    return this.localPeerId < peerId;
  }
  
  /**
   * Clean up a peer connection
   * @param peerId Peer ID
   */
  private cleanupPeerConnection(peerId: string): void {
    console.log(`Cleaning up connection to peer: ${peerId}`);
    
    // Close the data channel
    if (this.dataChannels.has(peerId)) {
      const dataChannel = this.dataChannels.get(peerId)!;
      dataChannel.close();
      this.dataChannels.delete(peerId);
    }
    
    // Close the peer connection
    if (this.peerConnections.has(peerId)) {
      const peerConnection = this.peerConnections.get(peerId)!;
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }
    
    // Clear pending ICE candidates
    this.pendingIceCandidates.delete(peerId);
    
    // Update Redux store
    store.dispatch(removePeerConnection(peerId));
  }
  
  /**
   * Clean up all connections
   */
  public async cleanup(): Promise<void> {
    console.log('Cleaning up all P2P connections...');
    
    // Close all data channels
    for (const [peerId, dataChannel] of this.dataChannels.entries()) {
      console.log(`Closing data channel for peer: ${peerId}`);
      dataChannel.close();
    }
    this.dataChannels.clear();
    
    // Close all peer connections
    for (const [peerId, peerConnection] of this.peerConnections.entries()) {
      console.log(`Closing peer connection for peer: ${peerId}`);
      peerConnection.close();
    }
    this.peerConnections.clear();
    
    // Clear pending ICE candidates
    this.pendingIceCandidates.clear();
    
    // Update Redux store
    store.dispatch(setConnectionStatus(false));
  }
  
  /**
   * Get a flowchart key by its ID
   * @param flowchartId Flowchart ID
   * @returns The key, or null if not found
   */
  public getFlowchartKey(flowchartId: string): string | null {
    return this.flowchartKeys.get(flowchartId) || null;
  }
  
  /**
   * Get local peer ID
   * @returns Local peer ID
   */
  public getLocalPeerId(): string | null {
    return this.localPeerId;
  }
  
  /**
   * Set local user info
   * @param userInfo User info
   */
  public setLocalUserInfo(userInfo: any): void {
    this.localUserInfo = userInfo;
    
    // Send to all connected peers
    for (const peerId of this.dataChannels.keys()) {
      this.sendToPeer(peerId, {
        type: 'user-info',
        info: userInfo
      });
    }
  }
  
  /**
   * Register a callback for flowchart updates
   * @param callback Callback function
   */
  public onFlowchartUpdate(callback: (data: any) => void): void {
    this.flowchartUpdateCallback = callback;
  }
  
  /**
   * Send a flowchart update to all peers
   * @param data Flowchart data
   */
  public sendFlowchartUpdate(data: any): void {
    for (const peerId of this.dataChannels.keys()) {
      this.sendToPeer(peerId, {
        type: 'flowchart-update',
        ...data
      });
    }
  }
  
  /**
   * Send cursor position to all peers
   * @param x X coordinate
   * @param y Y coordinate
   */
  public sendCursorPosition(x: number, y: number): void {
    for (const peerId of this.dataChannels.keys()) {
      this.sendToPeer(peerId, {
        type: 'cursor-position',
        x,
        y
      });
    }
  }
}

// Create a singleton instance
const p2pService = new P2PService();

export default p2pService; 