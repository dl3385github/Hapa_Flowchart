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
const generatePeerId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create a topic key from string input
const createTopicKey = (input: string): Uint8Array => {
  return crypto.createHash('sha256')
    .update(input)
    .digest();
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
      console.log(`New peer connected: ${remotePeerId.slice(0, 6)}`);
      
      // Set up the WebRTC connection
      this.setupWebRTC(remotePeerId, conn);
      
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
   */
  private async setupWebRTC(peerId: string, swarmConn: any): Promise<void> {
    try {
      console.log(`Setting up WebRTC with peer: ${peerId.slice(0, 6)}`);
      
      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10 // Increase candidate pool for better connectivity
      });
      
      // Store the connection
      this.peerConnections.set(peerId, peerConnection);
      
      // Set up a data channel
      const dataChannelId = `flowchart-${this.activeFlowchartKey?.slice(0, 6) || ''}-${Date.now()}`;
      console.log(`Creating data channel: ${dataChannelId}`);
      
      const dataChannel = peerConnection.createDataChannel(dataChannelId, {
        ordered: true,
        negotiated: false  // Let WebRTC handle negotiation
      });
      
      // Handle data channel state changes
      dataChannel.onopen = () => {
        console.log(`Data channel open with peer: ${peerId.slice(0, 6)}`);
        this.dataChannels.set(peerId, dataChannel);
        
        // Update connection status
        store.dispatch(setPeerConnection({
          peerId,
          connection: 'connected'
        }));
        
        // Send our user info
        if (this.localUserInfo) {
          this.sendToPeer(peerId, {
            type: 'user-info',
            info: this.localUserInfo
          });
        }
        
        // Send initial flowchart data if we're the initiator
        if (this.shouldInitiateConnection(peerId)) {
          setTimeout(() => {
            if (this.activeFlowchartKey && this.flowchartUpdateCallback) {
              // Trigger a flowchart update callback to send the current state
              this.flowchartUpdateCallback({
                requestUpdate: true
              });
            }
          }, 500);
        }
      };
      
      dataChannel.onclose = () => {
        console.log(`Data channel closed with peer: ${peerId.slice(0, 6)}`);
        this.dataChannels.delete(peerId);
      };
      
      dataChannel.onerror = (error) => {
        console.error(`Data channel error with peer ${peerId.slice(0, 6)}:`, error);
      };
      
      dataChannel.onmessage = (event) => {
        this.handleDataChannelMessage(peerId, event.data);
      };
      
      // Handle incoming data channels
      peerConnection.ondatachannel = (event) => {
        console.log(`Received data channel from peer: ${peerId.slice(0, 6)}`);
        const incomingChannel = event.channel;
        
        incomingChannel.onopen = () => {
          console.log(`Incoming data channel open with peer: ${peerId.slice(0, 6)}`);
          this.dataChannels.set(peerId, incomingChannel);
          
          // Update connection status
          store.dispatch(setPeerConnection({
            peerId,
            connection: 'connected'
          }));
          
          // Send our user info
          if (this.localUserInfo) {
            this.sendToPeer(peerId, {
              type: 'user-info',
              info: this.localUserInfo
            });
          }
        };
        
        incomingChannel.onclose = () => {
          console.log(`Incoming data channel closed with peer: ${peerId.slice(0, 6)}`);
          this.dataChannels.delete(peerId);
        };
        
        incomingChannel.onerror = (error) => {
          console.error(`Incoming data channel error with peer ${peerId.slice(0, 6)}:`, error);
        };
        
        incomingChannel.onmessage = (event) => {
          this.handleDataChannelMessage(peerId, event.data);
        };
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`Generated ICE candidate for peer: ${peerId.slice(0, 6)}`);
          // Send the candidate via hyperswarm
          const signal = {
            type: 'ice-candidate',
            candidate: event.candidate
          };
          
          swarmConn.write(JSON.stringify(signal));
        } else {
          console.log(`Finished generating ICE candidates for peer: ${peerId.slice(0, 6)}`);
        }
      };
      
      // Handle ICE gathering state changes
      peerConnection.onicegatheringstatechange = () => {
        console.log(`ICE gathering state changed to: ${peerConnection.iceGatheringState}`);
      };
      
      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state with peer ${peerId.slice(0, 6)} changed to: ${peerConnection.iceConnectionState}`);
        
        if (peerConnection.iceConnectionState === 'disconnected' || 
            peerConnection.iceConnectionState === 'failed' ||
            peerConnection.iceConnectionState === 'closed') {
          console.warn(`WebRTC connection with peer ${peerId.slice(0, 6)} ${peerConnection.iceConnectionState}`);
          
          // Only clean up if the state is failed or closed, try to recover from disconnected
          if (peerConnection.iceConnectionState === 'failed' || 
              peerConnection.iceConnectionState === 'closed') {
            this.cleanupPeerConnection(peerId);
          } else {
            // For disconnected state, wait a bit and see if it recovers
            setTimeout(() => {
              if (this.peerConnections.has(peerId)) {
                const currentState = this.peerConnections.get(peerId)?.iceConnectionState;
                if (currentState === 'disconnected') {
                  console.log(`Connection with peer ${peerId.slice(0, 6)} still disconnected, cleaning up`);
                  this.cleanupPeerConnection(peerId);
                }
              }
            }, 5000);
          }
        } else if (peerConnection.iceConnectionState === 'connected') {
          console.log(`WebRTC connection with peer ${peerId.slice(0, 6)} established`);
          // Update connection status in Redux
          store.dispatch(setPeerConnection({
            peerId,
            connection: 'connected'
          }));
        }
      };
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with peer ${peerId.slice(0, 6)} changed to: ${peerConnection.connectionState}`);
        
        if (peerConnection.connectionState === 'connected') {
          console.log(`Connection with peer ${peerId.slice(0, 6)} established successfully`);
          
          // Update the Redux store
          store.dispatch(setPeerConnection({
            peerId,
            connection: 'connected'
          }));
        } else if (peerConnection.connectionState === 'failed' || 
                   peerConnection.connectionState === 'closed') {
          console.warn(`Connection with peer ${peerId.slice(0, 6)} ${peerConnection.connectionState}`);
          this.cleanupPeerConnection(peerId);
        }
      };
      
      // Should we create an offer?
      const shouldCreateOffer = this.shouldInitiateConnection(peerId);
      if (shouldCreateOffer) {
        console.log(`Creating offer for peer: ${peerId.slice(0, 6)}`);
        try {
          // Create and send offer
          const offer = await peerConnection.createOffer({
            offerToReceiveAudio: false,
            offerToReceiveVideo: false,
            iceRestart: true  // Allow ICE restart for better connectivity
          });
          
          await peerConnection.setLocalDescription(offer);
          
          // Send the offer via hyperswarm
          const signal = {
            type: 'offer',
            sdp: {
              type: offer.type,
              sdp: offer.sdp
            }
          };
          
          swarmConn.write(JSON.stringify(signal));
        } catch (err) {
          console.error(`Error creating offer for peer ${peerId.slice(0, 6)}:`, err);
          store.dispatch(setSignalingError(`Error creating offer: ${err.message}`));
        }
      }
    } catch (error) {
      console.error(`Error setting up WebRTC with peer ${peerId}:`, error);
      // Attempt graceful recovery
      if (this.peerConnections.has(peerId)) {
        this.cleanupPeerConnection(peerId);
      }
      
      store.dispatch(setSignalingError(`WebRTC setup error: ${error.message}`));
    }
  }
  
  /**
   * Handle a WebRTC signaling message received via Hyperswarm
   * @param peerId Peer ID
   * @param signal Signal data
   */
  private async handleSignalReceived(peerId: string, signal: any): Promise<void> {
    try {
      if (!this.peerConnections.has(peerId)) {
        console.warn(`No WebRTC connection for peer ${peerId}, ignoring signal`);
        return;
      }
      
      const peerConnection = this.peerConnections.get(peerId)!;
      
      if (signal.type === 'offer') {
        console.log(`Setting remote description (offer) from peer ${peerId.slice(0, 6)}`);
        
        try {
          // Create an RTCSessionDescription from the offer
          const rtcSessionDescription = new RTCSessionDescription({
            type: signal.sdp.type,
            sdp: signal.sdp.sdp
          });
          
          // Set the remote description
          await peerConnection.setRemoteDescription(rtcSessionDescription);
          
          // Create an answer
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          // Find the connection to send the answer
          let found = false;
          for (const [topicHex, topicInfo] of this.swarm.topics.entries()) {
            for (const remotePeerId of topicInfo.peers) {
              if (remotePeerId === peerId) {
                const conn = this.swarm.connections.get(peerId);
                if (conn) {
                  // Send the answer
                  const answerSignal = {
                    type: 'answer',
                    sdp: {
                      type: answer.type,
                      sdp: answer.sdp
                    }
                  };
                  
                  conn.write(JSON.stringify(answerSignal));
                  found = true;
                  
                  // Process any pending ICE candidates
                  await this.processPendingIceCandidates(peerId, peerConnection);
                  break;
                }
              }
            }
            if (found) break;
          }
          
          if (!found) {
            // Try to send through the global connection map as a fallback
            const conn = this.swarm.connections.get(peerId);
            if (conn) {
              const answerSignal = {
                type: 'answer',
                sdp: {
                  type: answer.type,
                  sdp: answer.sdp
                }
              };
              
              conn.write(JSON.stringify(answerSignal));
              
              // Process any pending ICE candidates
              await this.processPendingIceCandidates(peerId, peerConnection);
            } else {
              console.error(`Could not find connection to peer ${peerId.slice(0, 6)} to send answer`);
            }
          }
        } catch (err) {
          console.error(`Error handling offer from peer ${peerId.slice(0, 6)}:`, err);
          store.dispatch(setSignalingError(`Error handling offer: ${err.message}`));
        }
      } else if (signal.type === 'answer') {
        console.log(`Setting remote description (answer) from peer ${peerId.slice(0, 6)}`);
        
        try {
          // Create an RTCSessionDescription from the answer
          const rtcSessionDescription = new RTCSessionDescription({
            type: signal.sdp.type,
            sdp: signal.sdp.sdp
          });
          
          // Set the remote description
          await peerConnection.setRemoteDescription(rtcSessionDescription);
          
          // Process any pending ICE candidates
          await this.processPendingIceCandidates(peerId, peerConnection);
        } catch (err) {
          console.error(`Error handling answer from peer ${peerId.slice(0, 6)}:`, err);
          store.dispatch(setSignalingError(`Error handling answer: ${err.message}`));
        }
      } else if (signal.type === 'ice-candidate') {
        console.log(`Received ICE candidate from peer ${peerId.slice(0, 6)}`);
        
        // If we have a remote description, add the ICE candidate immediately
        if (peerConnection.remoteDescription) {
          await this.addIceCandidate(peerId, peerConnection, signal.candidate);
        } else {
          // Otherwise, store it to process later
          if (!this.pendingIceCandidates.has(peerId)) {
            this.pendingIceCandidates.set(peerId, []);
          }
          
          this.pendingIceCandidates.get(peerId)!.push(signal.candidate);
          console.log(`Stored pending ICE candidate for peer ${peerId.slice(0, 6)}, now have ${this.pendingIceCandidates.get(peerId)!.length}`);
        }
      }
    } catch (error) {
      console.error(`Error handling signal from peer ${peerId}:`, error);
      store.dispatch(setSignalingError(`Signaling error: ${error.message}`));
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
    console.log(`Processing ${candidates.length} pending ICE candidates for peer ${peerId.slice(0, 6)}`);
    
    // Process each candidate with a small delay between them to avoid overwhelming the connection
    for (let i = 0; i < candidates.length; i++) {
      try {
        await this.addIceCandidate(peerId, peerConnection, candidates[i]);
        // Small delay between processing candidates
        if (i < candidates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      } catch (error) {
        console.error(`Error processing ICE candidate ${i} for peer ${peerId.slice(0, 6)}:`, error);
      }
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
      if (!peerConnection.remoteDescription) {
        console.warn(`Cannot add ICE candidate for peer ${peerId.slice(0, 6)} without remote description`);
        
        // Store it to process later
        if (!this.pendingIceCandidates.has(peerId)) {
          this.pendingIceCandidates.set(peerId, []);
        }
        
        this.pendingIceCandidates.get(peerId)!.push(candidate);
        return;
      }
      
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`Added ICE candidate for peer ${peerId.slice(0, 6)}`);
    } catch (error) {
      console.error(`Error adding ICE candidate for peer ${peerId.slice(0, 6)}:`, error);
      
      // If it's a timing issue, store the candidate to try again later
      if (!this.pendingIceCandidates.has(peerId)) {
        this.pendingIceCandidates.set(peerId, []);
      }
      
      this.pendingIceCandidates.get(peerId)!.push(candidate);
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