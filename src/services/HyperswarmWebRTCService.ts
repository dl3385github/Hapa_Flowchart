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
import * as hyperswarmWeb from 'hyperswarm-web';
import SimplePeer from 'simple-peer';

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

// Public hyperswarm-web bootstrap servers
// Modify this list to include your own bootstrap servers for production
const BOOTSTRAP_SERVERS = [
  'wss://geut-webrtc-signal.herokuapp.com',  // GEUT's public signal server
  'wss://signal.hyperswarm.dev',             // Hyperswarm's public signal server
  'wss://hyperswarm.mauve.moe',              // A community maintained signal server
];

// Generate a 32-byte key compatible with Hypercore/Hyperswarm
const generateHypercoreKey = () => {
  const key = new Uint8Array(32);
  window.crypto.getRandomValues(key);
  return Array.from(key)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Service for managing WebRTC connections via Hyperswarm DHT
 */
class HyperswarmWebRTCService {
  private swarm: any = null;
  private dataChannels: Map<string, SimplePeer.Instance> = new Map();
  private localPeerId: string | null = null;
  private hypercoreKey: string | null = null;
  private flowchartKeys: Map<string, string> = new Map();
  private flowchartUpdateCallback: ((data: any) => void) | null = null;
  private localUserInfo: any = null;
  private connectionEstablished: boolean = false;
  private pendingDataRequests: Set<string> = new Set();
  private connectedFlowchartId: string | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private discoveryConfig: any = null;

  constructor() {
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
   * Initialize the Hyperswarm WebRTC service
   * @returns The local peer ID
   */
  public async initialize(): Promise<string> {
    try {
      // Generate a local peer ID if we don't have one
      if (!this.localPeerId) {
        this.localPeerId = generateHypercoreKey();
        store.dispatch(setLocalPeerId(this.localPeerId));
      }
      
      // Initialize the hyperswarm-web instance
      await this.initializeHyperswarm();
      
      return this.localPeerId;
    } catch (error) {
      console.error('Failed to initialize Hyperswarm WebRTC service:', error);
      store.dispatch(setSignalingError('Failed to initialize hyperswarm service'));
      throw error;
    }
  }
  
  /**
   * Initialize the hyperswarm-web instance with WebRTC support
   */
  private async initializeHyperswarm(): Promise<void> {
    try {
      console.log('Initializing Hyperswarm WebRTC service...');
      
      // Close existing swarm if it exists
      if (this.swarm) {
        try {
          await this.cleanup();
        } catch (e) {
          console.error('Error cleaning up existing swarm:', e);
        }
      }
      
      // Create a new hyperswarm-web instance with WebRTC configuration
      this.swarm = hyperswarmWeb({
        // Use the provided bootstrap servers for signaling
        bootstrap: BOOTSTRAP_SERVERS,
        // Configure SimplePeer with ICE servers for NAT traversal
        simplePeer: {
          config: {
            iceServers: ICE_SERVERS
          }
        },
        // Max peers to connect to simultaneously (adjust based on performance needs)
        maxPeers: 10,
        // Reconnect delay for websocket connections to bootstrap servers
        wsReconnectDelay: 3000
      });
      
      // Set up event handlers for the swarm
      this.setupSwarmHandlers();
      
      console.log('Hyperswarm WebRTC service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize hyperswarm:', error);
      
      // Retry a few times with increasing delays before giving up
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = this.retryCount * 2000; // Incremental backoff
        console.log(`Retrying to initialize hyperswarm in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.initializeHyperswarm();
      }
      
      throw error;
    }
  }
  
  /**
   * Set up event handlers for the hyperswarm instance
   */
  private setupSwarmHandlers(): void {
    if (!this.swarm) return;
    
    // Handle new connections
    this.swarm.on('connection', (socket: any, details: any) => {
      const remotePeerId = details.peer?.id || 'unknown-peer';
      console.log(`New peer connection: ${remotePeerId}`, details);
      
      // Add this connection to our data channels
      this.dataChannels.set(remotePeerId, socket);
      
      // Notify the UI of the new connection
      store.dispatch(setPeerConnection({
        peerId: remotePeerId,
        connection: 'connected'
      }));
      
      store.dispatch(updatePeer({
        peerId: remotePeerId,
        info: {
          peerId: remotePeerId,
          name: `Peer ${remotePeerId.slice(0, 6)}`,
          lastSeen: new Date().toISOString()
        }
      }));
      
      // Set up handlers for this connection
      this.setupConnectionHandlers(socket, remotePeerId);
      
      // Mark as connected
      this.connectionEstablished = true;
      store.dispatch(setConnectionStatus(true));
      
      // Send our user info to the peer
      if (this.localUserInfo) {
        this.sendToPeer(remotePeerId, {
          type: 'user-info',
          info: this.localUserInfo
        });
      }
      
      // If we're sharing a flowchart, inform the peer
      if (this.hypercoreKey && this.connectedFlowchartId) {
        console.log(`Informing peer ${remotePeerId} about active flowchart: ${this.hypercoreKey}`);
        this.sendToPeer(remotePeerId, {
          type: 'active-flowchart',
          flowchartKey: this.hypercoreKey
        });
        
        // If waiting for flowchart data, request it
        if (this.pendingDataRequests.has(this.hypercoreKey)) {
          console.log(`Requesting data for flowchart: ${this.hypercoreKey}`);
          this.sendToPeer(remotePeerId, {
            type: 'request-flowchart',
            flowchartKey: this.hypercoreKey
          });
        }
      }
    });
    
    // Handle disconnections
    this.swarm.on('disconnection', (socket: any, details: any) => {
      const remotePeerId = details.peer?.id || 'unknown-peer';
      console.log(`Peer disconnected: ${remotePeerId}`, details);
      
      // Clean up this peer's connection
      this.dataChannels.delete(remotePeerId);
      store.dispatch(removePeerConnection(remotePeerId));
    });
    
    // Handle connection errors
    this.swarm.on('error', (error: any) => {
      console.error('Hyperswarm error:', error);
      store.dispatch(setSignalingError(`Hyperswarm error: ${error.message || 'Unknown error'}`));
    });
  }
  
  /**
   * Set up handlers for a specific peer connection
   * @param socket The socket connection to the peer
   * @param peerId The ID of the peer
   */
  private setupConnectionHandlers(socket: SimplePeer.Instance, peerId: string): void {
    // Handle data from the peer
    socket.on('data', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handlePeerMessage(peerId, message);
      } catch (error) {
        console.error(`Error handling message from peer ${peerId}:`, error);
      }
    });
    
    // Handle errors
    socket.on('error', (error: Error) => {
      console.error(`Error with connection to peer ${peerId}:`, error);
      this.cleanupPeerConnection(peerId);
    });
    
    // Handle connection close
    socket.on('close', () => {
      console.log(`Connection to peer ${peerId} closed`);
      this.cleanupPeerConnection(peerId);
    });
  }
  
  /**
   * Handle a message received from a peer
   * @param peerId The ID of the peer
   * @param message The message received
   */
  private handlePeerMessage(peerId: string, message: any): void {
    console.log(`Received message from peer ${peerId}:`, message.type);
    
    // Verify the flowchart key if provided
    if (message.flowchartKey && this.hypercoreKey && message.flowchartKey !== this.hypercoreKey) {
      console.log(`Ignoring message for different flowchart: ${message.flowchartKey} (ours: ${this.hypercoreKey})`);
      return;
    }
    
    // Update the last seen timestamp for this peer
    store.dispatch(updatePeer({
      peerId,
      info: {
        lastSeen: new Date().toISOString()
      }
    }));
    
    // Handle different message types
    switch (message.type) {
      case 'user-info':
        // Update peer info in Redux
        store.dispatch(updatePeer({
          peerId,
          info: message.info
        }));
        console.log(`Updated user info for peer ${peerId}:`, message.info);
        break;
        
      case 'cursor-position':
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
        break;
        
      case 'active-flowchart':
        console.log(`Peer ${peerId} is working on flowchart: ${message.flowchartKey}`);
        
        // If we're waiting for this flowchart's data, request it
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
        break;
        
      case 'request-flowchart':
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
            const validNodes = flowchart.nodes.filter((node: any) => 
              node && node.id && node.type && node.position
            );
            
            const validEdges = flowchart.edges.filter((edge: any) => 
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
            } else {
              console.error(`Failed to send flowchart data to peer ${peerId}`);
            }
          } else {
            console.log(`No flowchart data available for key: ${message.flowchartKey}`);
          }
        } else {
          console.log(`Cannot provide flowchart data for requested key ${message.flowchartKey} (our key: ${this.hypercoreKey})`);
        }
        break;
        
      case 'flowchart-data':
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
        
        // Notify callback about the complete flowchart update
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
        break;
        
      case 'flowchart-update':
        // Handle flowchart updates (partial updates)
        if (this.flowchartUpdateCallback) {
          console.log('Received flowchart update from peer:', message.data);
          this.flowchartUpdateCallback(message.data);
        }
        break;
        
      case 'node-operation':
        // Handle node operations (move, delete, add)
        if (this.flowchartUpdateCallback) {
          console.log(`Received node operation from peer ${peerId}:`, message.operation);
          this.flowchartUpdateCallback({
            nodeOperation: message.operation
          });
        }
        break;
        
      case 'edge-operation':
        // Handle edge operations (create, delete)
        if (this.flowchartUpdateCallback) {
          console.log(`Received edge operation from peer ${peerId}:`, message.operation);
          this.flowchartUpdateCallback({
            edgeOperation: message.operation
          });
        }
        break;
        
      default:
        console.warn(`Unknown message type from peer ${peerId}:`, message.type);
    }
  }
  
  /**
   * Send data to a specific peer
   * @param peerId The ID of the peer
   * @param data The data to send
   * @returns Whether the send was successful
   */
  private sendToPeer(peerId: string, data: any): boolean {
    try {
      const socket = this.dataChannels.get(peerId);
      if (socket) {
        socket.send(JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to send data to peer ${peerId}:`, error);
      return false;
    }
  }
  
  /**
   * Clean up a peer connection
   * @param peerId The ID of the peer
   */
  private cleanupPeerConnection(peerId: string): void {
    console.log(`Cleaning up connection to peer: ${peerId}`);
    
    // Close and remove the connection
    const socket = this.dataChannels.get(peerId);
    if (socket) {
      try {
        socket.destroy();
      } catch (e) {
        console.error(`Error destroying connection to peer ${peerId}:`, e);
      }
      this.dataChannels.delete(peerId);
    }
    
    // Update Redux store
    store.dispatch(removePeerConnection(peerId));
  }

  /**
   * Get the local peer ID
   * @returns The local peer ID
   */
  public getLocalPeerId(): string | null {
    return this.localPeerId;
  }

  /**
   * Set local user information for sharing with peers
   * @param userInfo User information to share
   */
  public setLocalUserInfo(userInfo: any): void {
    this.localUserInfo = userInfo;
    console.log('Local user info set:', userInfo);
    
    // Send to all connected peers
    this.dataChannels.forEach((_, peerId) => {
      this.sendToPeer(peerId, {
        type: 'user-info',
        info: userInfo
      });
    });
  }

  /**
   * Register callback for flowchart updates
   * @param callback Callback function to be called when flowchart updates are received
   */
  public onFlowchartUpdate(callback: (data: any) => void): void {
    this.flowchartUpdateCallback = callback;
    console.log('Flowchart update callback registered');
  }

  /**
   * Update peer information from awareness data
   * @param peerId The ID of the peer
   * @param info The peer's information
   */
  public updatePeerFromAwareness(peerId: string, info: any): void {
    store.dispatch(updatePeer({
      peerId,
      info: {
        ...info,
        peerId
      }
    }));
  }
  
  /**
   * Create a Hyperswarm discovery key from a string
   * @param key The string key to convert
   * @returns A Uint8Array discovery key
   */
  private createDiscoveryKey(key: string): Uint8Array {
    // First, ensure key is buffer-like by converting hex string to Uint8Array if needed
    let keyBuffer: Uint8Array;
    
    if (typeof key === 'string') {
      // If key is in hex format, convert to Uint8Array
      if (key.match(/^[0-9a-f]+$/i)) {
        keyBuffer = new Uint8Array(key.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      } else {
        // Otherwise, use string's UTF-8 encoding
        keyBuffer = new TextEncoder().encode(key);
      }
    } else {
      throw new Error('Key must be a string');
    }
    
    // Create a sha256 hash of the key to use as the discovery key
    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(keyBuffer));
    const digest = hash.digest();
    
    // Convert Node.js Buffer to Uint8Array
    return new Uint8Array(digest);
  }

  /**
   * Create and share a flowchart
   * @param flowchartId The ID of the flowchart
   * @returns The hypercore key
   */
  public async createSharedFlowchart(flowchartId: string): Promise<string> {
    try {
      // Check if we already have a key for this flowchart
      if (this.flowchartKeys.has(flowchartId)) {
        this.hypercoreKey = this.flowchartKeys.get(flowchartId)!;
        
        // Set the active flowchart key in Redux
        store.dispatch(setActiveFlowchartKey(this.hypercoreKey));
        
        console.log(`Using existing key for flowchart ${flowchartId}: ${this.hypercoreKey}`);
      } else {
        // Generate a new key for this flowchart
        this.hypercoreKey = generateHypercoreKey();
        
        // Store the association between flowchart ID and its key
        this.flowchartKeys.set(flowchartId, this.hypercoreKey);
        
        // Save to localStorage for persistence
        this.saveStoredKeys();
        
        // Set the active flowchart key in Redux
        store.dispatch(setActiveFlowchartKey(this.hypercoreKey));
        
        console.log(`Created new key for flowchart ${flowchartId}: ${this.hypercoreKey}`);
      }
      
      // Track the currently connected flowchart ID
      this.connectedFlowchartId = flowchartId;
      
      // Ensure we have a swarm instance
      if (!this.swarm) {
        await this.initializeHyperswarm();
      }
      
      // Create discovery key from the hypercore key
      const discoveryKey = this.createDiscoveryKey(this.hypercoreKey);
      
      // Join the swarm with this discovery key
      console.log(`Joining swarm with discovery key for flowchart ${flowchartId}`);
      this.discoveryConfig = this.swarm.join(discoveryKey, {
        announce: true,  // Announce our presence
        lookup: true     // Look for other peers
      });
      
      // Notify current peers about the active flowchart
      this.dataChannels.forEach((_, peerId) => {
        this.sendToPeer(peerId, {
          type: 'active-flowchart',
          flowchartKey: this.hypercoreKey
        });
      });
      
      return this.hypercoreKey;
    } catch (error) {
      console.error('Failed to create shared flowchart:', error);
      store.dispatch(setSignalingError('Failed to create shared flowchart'));
      throw error;
    }
  }
  
  /**
   * Get the Hypercore key for a flowchart
   * @param flowchartId The ID of the flowchart
   * @returns The hypercore key
   */
  public getFlowchartKey(flowchartId: string): string | null {
    const key = this.flowchartKeys.get(flowchartId) || null;
    
    // Set the active flowchart key in Redux
    if (key) {
      store.dispatch(setActiveFlowchartKey(key));
    }
    
    return key;
  }
  
  /**
   * Join an existing shared flowchart
   * @param hypercoreKey The hypercore key of the flowchart
   * @returns Whether the join was successful
   */
  public async joinSharedFlowchart(hypercoreKey: string): Promise<boolean> {
    try {
      console.log(`Joining flowchart with key: ${hypercoreKey}`);
      
      // First, cleanup any existing connections for other flowcharts
      if (this.hypercoreKey && this.hypercoreKey !== hypercoreKey) {
        console.log(`Cleaning up connections from previous flowchart ${this.hypercoreKey}`);
        
        // Leave the previous swarm topic
        if (this.discoveryConfig) {
          try {
            await this.swarm.leave(this.discoveryConfig);
          } catch (e) {
            console.error('Error leaving previous swarm:', e);
          }
          this.discoveryConfig = null;
        }
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
      
      // Ensure we have a swarm instance
      if (!this.swarm) {
        await this.initializeHyperswarm();
      }
      
      // Create discovery key from the hypercore key
      const discoveryKey = this.createDiscoveryKey(hypercoreKey);
      
      // Mark this flowchart key as pending a data request
      this.pendingDataRequests.add(hypercoreKey);
      
      // Set connection status to connecting
      store.dispatch(setConnectionStatus(true));
      
      // Join the swarm with this discovery key
      console.log(`Joining swarm with discovery key for flowchart key: ${hypercoreKey}`);
      this.discoveryConfig = this.swarm.join(discoveryKey, {
        announce: true,  // Announce our presence
        lookup: true     // Look for other peers
      });
      
      // Notify current peers about the active flowchart
      this.dataChannels.forEach((_, peerId) => {
        this.sendToPeer(peerId, {
          type: 'active-flowchart',
          flowchartKey: hypercoreKey
        });
        
        // Request flowchart data if we're joining
        this.sendToPeer(peerId, {
          type: 'request-flowchart',
          flowchartKey: hypercoreKey
        });
      });
      
      return true;
    } catch (error) {
      console.error('Failed to join shared flowchart:', error);
      store.dispatch(setSignalingError('Failed to join shared flowchart'));
      return false;
    }
  }
  
  /**
   * Send a flowchart update to all connected peers
   * @param flowchartData The flowchart data to send
   */
  public sendFlowchartUpdate(flowchartData: any): void {
    console.log('Sending flowchart update to all peers');
    
    const message = {
      type: 'flowchart-update',
      data: flowchartData,
      timestamp: Date.now()
    };
    
    // Send to all connected peers
    let sentToAnyPeer = false;
    this.dataChannels.forEach((_, peerId) => {
      const success = this.sendToPeer(peerId, message);
      if (success) {
        sentToAnyPeer = true;
        console.log(`Sent flowchart update to peer: ${peerId}`);
      }
    });
    
    if (!sentToAnyPeer && this.dataChannels.size > 0) {
      console.warn('Could not send flowchart update to any peer - none are connected');
    } else if (this.dataChannels.size === 0) {
      console.log('No peers connected to send flowchart update to');
    }
  }
  
  /**
   * Send cursor position to all connected peers
   * @param x X coordinate
   * @param y Y coordinate
   */
  public sendCursorPosition(x: number, y: number): void {
    const message = {
      type: 'cursor-position',
      x,
      y,
      timestamp: Date.now()
    };
    
    // Send to all connected peers
    this.dataChannels.forEach((_, peerId) => {
      this.sendToPeer(peerId, message);
    });
  }
  
  /**
   * Clean up all connections
   */
  public async cleanup(): Promise<void> {
    console.log('Cleaning up Hyperswarm WebRTC connections');
    
    // Clear any pending data requests
    this.pendingDataRequests.clear();
    
    // Close all peer connections
    this.dataChannels.forEach((socket, peerId) => {
      try {
        socket.destroy();
      } catch (e) {
        console.error(`Error destroying connection to peer ${peerId}:`, e);
      }
    });
    
    // Clear the map
    this.dataChannels.clear();
    
    // Leave the current swarm topic if any
    if (this.swarm && this.discoveryConfig) {
      try {
        await this.swarm.leave(this.discoveryConfig);
      } catch (e) {
        console.error('Error leaving swarm:', e);
      }
      this.discoveryConfig = null;
    }
    
    // Destroy the swarm
    if (this.swarm) {
      try {
        await this.swarm.destroy();
      } catch (e) {
        console.error('Error destroying swarm:', e);
      }
      this.swarm = null;
    }
    
    // Reset state
    this.hypercoreKey = null;
    this.connectionEstablished = false;
    this.connectedFlowchartId = null;
    this.retryCount = 0;
    
    // Update Redux store
    store.dispatch(setConnectionStatus(false));
    
    console.log('Hyperswarm WebRTC connections cleaned up');
  }
}

// Create a singleton instance
const hyperswarmWebRTCService = new HyperswarmWebRTCService();

export default hyperswarmWebRTCService; 