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
import hyperswarmWebFactory from '../utils/hyperswarmWebFactory';
import { Duplex } from 'stream';
import { 
  BOOTSTRAP_SERVERS, 
  ICE_SERVERS, 
  MAX_PEERS, 
  WS_RECONNECT_DELAY 
} from '../config/hyperswarm';

// Generate a Hypercore-compatible key (32-byte random key)
const generateHypercoreKey = (): string => {
  const key = new Uint8Array(32);
  window.crypto.getRandomValues(key);
  return Array.from(key)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Convert a hexadecimal string key to a Buffer
const keyToBuffer = (key: string): Buffer => {
  // Ensure key is valid hex
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error('Invalid hypercore key format');
  }
  return Buffer.from(key, 'hex');
};

// Create a discovery topic from a hypercore key
const keyToTopic = (key: string): Buffer => {
  // Use SHA-256 to hash the key to create a topic for discovery
  return crypto.createHash('sha256')
    .update(Buffer.from(key, 'hex'))
    .digest();
};

class HyperswarmWebRTCService {
  private hyperswarm: any = null;
  private localPeerId: string | null = null;
  private activeFlowchartKey: string | null = null;
  private flowchartKeys: Map<string, string> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private flowchartUpdateCallback: ((data: any) => void) | null = null;
  private localUserInfo: any = null;
  private connectionEstablished: boolean = false;
  private pendingDataRequests: Set<string> = new Set();
  private connectedFlowchartId: string | null = null;
  private streams: Map<string, Duplex> = new Map();
  
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
  
  // Initialize the Hyperswarm service
  public async initialize(): Promise<string> {
    try {
      // Generate a local peer ID if we don't have one
      if (!this.localPeerId) {
        this.localPeerId = generateHypercoreKey();
        store.dispatch(setLocalPeerId(this.localPeerId));
      }
      
      // Initialize Hyperswarm
      this.hyperswarm = hyperswarmWebFactory({
        bootstrap: BOOTSTRAP_SERVERS,
        simplePeer: {
          config: {
            iceServers: ICE_SERVERS
          },
          // Tweak WebRTC for optimal peer-to-peer connection
          trickle: true,
          wrtc: undefined // Use browser's built-in WebRTC implementation
        },
        maxPeers: MAX_PEERS,
        wsReconnectDelay: WS_RECONNECT_DELAY
      });
      
      // Set up event handlers
      this.setupEventHandlers();
      
      console.log('HyperswarmWebRTCService initialized successfully');
      return this.localPeerId;
    } catch (error) {
      console.error('Failed to initialize HyperswarmWebRTCService:', error);
      store.dispatch(setSignalingError('Failed to initialize peer-to-peer networking'));
      throw error;
    }
  }
  
  // Set up Hyperswarm event handlers
  private setupEventHandlers(): void {
    if (!this.hyperswarm) return;
    
    // Handle new connections
    this.hyperswarm.on('connection', (stream: Duplex, info: any) => {
      try {
        console.log('New peer connection:', info);
        
        // Generate a unique ID for this peer based on its info
        const peerId = info.publicKey ? 
          Buffer.from(info.publicKey).toString('hex') : 
          `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Store the stream
        this.streams.set(peerId, stream);
        
        // Setup data handling
        this.setupDataHandling(stream, peerId);
        
        // Update Redux store with new peer
        store.dispatch(setPeerConnection({
          peerId,
          connection: 'connected'
        }));
        
        // Notify about successful connection
        store.dispatch(setConnectionStatus(true));
        this.connectionEstablished = true;
        
        // If we're sharing a flowchart, immediately inform the peer
        if (this.activeFlowchartKey && this.connectedFlowchartId) {
          this.sendToPeer(peerId, {
            type: 'active-flowchart',
            flowchartKey: this.activeFlowchartKey
          });
          
          // If we have flowchart data, send it
          const state = store.getState();
          if (this.connectedFlowchartId && state.flowcharts.items[this.connectedFlowchartId]) {
            const flowchart = state.flowcharts.items[this.connectedFlowchartId];
            
            if (flowchart.nodes && flowchart.edges) {
              this.sendToPeer(peerId, {
                type: 'flowchart-data',
                flowchartKey: this.activeFlowchartKey,
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
        
        // If we have pending data requests, request the data
        if (this.activeFlowchartKey && this.pendingDataRequests.has(this.activeFlowchartKey)) {
          this.sendToPeer(peerId, {
            type: 'request-flowchart',
            flowchartKey: this.activeFlowchartKey
          });
        }
        
        // Send our user info
        if (this.localUserInfo) {
          this.sendToPeer(peerId, {
            type: 'user-info',
            info: this.localUserInfo
          });
        }
      } catch (error) {
        console.error('Error handling new connection:', error);
      }
    });
    
    // Handle disconnections
    this.hyperswarm.on('disconnection', (stream: Duplex, info: any) => {
      try {
        console.log('Peer disconnected:', info);
        
        // Find the corresponding peerId
        let disconnectedPeerId: string | null = null;
        
        for (const [peerId, storedStream] of this.streams.entries()) {
          if (storedStream === stream) {
            disconnectedPeerId = peerId;
            break;
          }
        }
        
        if (disconnectedPeerId) {
          // Clean up resources
          this.streams.delete(disconnectedPeerId);
          this.dataChannels.delete(disconnectedPeerId);
          
          // Update Redux store
          store.dispatch(removePeerConnection(disconnectedPeerId));
          
          // Check if we have any remaining connections
          if (this.streams.size === 0) {
            store.dispatch(setConnectionStatus(false));
            this.connectionEstablished = false;
          }
        }
      } catch (error) {
        console.error('Error handling disconnection:', error);
      }
    });
  }
  
  // Set up data handling for a stream
  private setupDataHandling(stream: Duplex, peerId: string): void {
    // Listen for data from the peer
    stream.on('data', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString('utf-8'));
        this.handlePeerMessage(peerId, message);
      } catch (error) {
        console.error('Error parsing peer message:', error);
      }
    });
    
    // Handle stream errors
    stream.on('error', (error: Error) => {
      console.error(`Stream error with peer ${peerId}:`, error);
      this.cleanupPeerConnection(peerId);
    });
    
    // Handle stream close
    stream.on('close', () => {
      console.log(`Stream closed with peer ${peerId}`);
      this.cleanupPeerConnection(peerId);
    });
  }
  
  // Handle a message from a peer
  private handlePeerMessage(peerId: string, message: any): void {
    try {
      console.log(`Received message from peer ${peerId}:`, 
        message.type, message.data ? 
          (typeof message.data === 'string' ? 
            message.data.substring(0, 100) + (message.data.length > 100 ? '...' : '') : 
            '(object)') : 
          '');
      
      // Verify the flowchart key if provided
      if (message.flowchartKey && this.activeFlowchartKey && message.flowchartKey !== this.activeFlowchartKey) {
        console.log(`Ignoring message for different flowchart: ${message.flowchartKey} (ours: ${this.activeFlowchartKey})`);
        return;
      }
      
      // Handle different message types
      switch (message.type) {
        case 'flowchart-update':
          // Notify callback about the update
          if (this.flowchartUpdateCallback) {
            console.log('Received flowchart update from peer:', message.data);
            this.flowchartUpdateCallback(message.data);
          }
          break;
          
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
          
          // If we're waiting for this flowchart's data, request it now
          if (this.pendingDataRequests.has(message.flowchartKey)) {
            console.log(`Requesting flowchart data for key: ${message.flowchartKey}`);
            this.sendToPeer(peerId, {
              type: 'request-flowchart',
              flowchartKey: message.flowchartKey
            });
          } else if (!this.activeFlowchartKey) {
            // If we don't have an active flowchart yet, adopt this one
            this.activeFlowchartKey = message.flowchartKey;
            console.log(`Adopting flowchart key from peer: ${this.activeFlowchartKey}`);
            
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
          if (this.activeFlowchartKey === message.flowchartKey && this.connectedFlowchartId) {
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
              } else {
                console.error(`Failed to send flowchart data to peer ${peerId}`);
              }
            } else {
              console.log(`No flowchart data available for key: ${message.flowchartKey}`);
            }
          } else {
            console.log(`Cannot provide flowchart data for requested key ${message.flowchartKey} (our key: ${this.activeFlowchartKey})`);
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
            
            // If we don't have an active flowchart key yet, adopt this one
            if (!this.activeFlowchartKey) {
              this.activeFlowchartKey = message.flowchartKey;
              
              // Create a temporary ID for this flowchart
              const tempFlowchartId = `shared-${message.flowchartKey.substring(0, 8)}`;
              this.flowchartKeys.set(tempFlowchartId, message.flowchartKey);
              this.connectedFlowchartId = tempFlowchartId;
              
              // Save to localStorage
              this.saveStoredKeys();
              
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
            
            console.log(`Passing flowchart data to update callback:`, 
              `Nodes: ${processedData.nodes.length}, Edges: ${processedData.edges.length}`);
            
            this.flowchartUpdateCallback(processedData);
          }
          break;
          
        case 'node-operation':
          // Handle node operations (move, delete, add)
          console.log(`Received node operation from peer ${peerId}:`, message.operation);
          
          if (this.flowchartUpdateCallback) {
            // Pass the operation to callback
            this.flowchartUpdateCallback({
              nodeOperation: message.operation
            });
          }
          break;
          
        case 'edge-operation':
          // Handle edge operations (create, delete)
          console.log(`Received edge operation from peer ${peerId}:`, message.operation);
          
          if (this.flowchartUpdateCallback) {
            // Pass the operation to callback
            this.flowchartUpdateCallback({
              edgeOperation: message.operation
            });
          }
          break;
          
        default:
          console.log(`Unhandled message type from peer ${peerId}:`, message.type);
      }
    } catch (error) {
      console.error('Failed to handle peer message:', error);
    }
  }
  
  // Send data to a specific peer
  private sendToPeer(peerId: string, data: any): boolean {
    try {
      const stream = this.streams.get(peerId);
      if (stream && !stream.destroyed) {
        stream.write(JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to send data to peer ${peerId}:`, error);
      return false;
    }
  }
  
  // Clean up a peer connection
  private cleanupPeerConnection(peerId: string): void {
    console.log(`Cleaning up connection to peer: ${peerId}`);
    
    // Get the stream
    const stream = this.streams.get(peerId);
    if (stream) {
      try {
        // Close the stream if it's not already destroyed
        if (!stream.destroyed) {
          stream.destroy();
        }
      } catch (e) {
        console.error('Error closing stream:', e);
      }
      
      // Remove the stream
      this.streams.delete(peerId);
    }
    
    // Remove any data channel
    this.dataChannels.delete(peerId);
    
    // Update Redux store
    store.dispatch(removePeerConnection(peerId));
    
    // Check if we have any remaining connections
    if (this.streams.size === 0) {
      store.dispatch(setConnectionStatus(false));
      this.connectionEstablished = false;
    }
  }
  
  // Create and share a flowchart
  public async createSharedFlowchart(flowchartId: string): Promise<string> {
    try {
      // Check if we already have a key for this flowchart
      if (this.flowchartKeys.has(flowchartId)) {
        this.activeFlowchartKey = this.flowchartKeys.get(flowchartId)!;
        
        // Set the active flowchart key in Redux
        store.dispatch(setActiveFlowchartKey(this.activeFlowchartKey));
        
        console.log(`Using existing key for flowchart ${flowchartId}: ${this.activeFlowchartKey}`);
        
        // Leave any previous topic
        if (this.hyperswarm && this.connectedFlowchartId && 
            this.connectedFlowchartId !== flowchartId && 
            this.flowchartKeys.has(this.connectedFlowchartId)) {
          const previousKey = this.flowchartKeys.get(this.connectedFlowchartId)!;
          await this.hyperswarm.leave(keyToTopic(previousKey));
          console.log(`Left previous flowchart topic: ${previousKey}`);
        }
        
        // Track the currently connected flowchart ID
        this.connectedFlowchartId = flowchartId;
        
        // Join the swarm with this topic
        if (this.hyperswarm) {
          const topic = keyToTopic(this.activeFlowchartKey);
          this.hyperswarm.join(topic, { announce: true, lookup: true });
          console.log(`Joined Hyperswarm with topic for flowchart key: ${this.activeFlowchartKey}`);
        }
        
        return this.activeFlowchartKey;
      }
      
      // Generate a new key for this flowchart
      this.activeFlowchartKey = generateHypercoreKey();
      
      // Store the association between flowchart ID and its key
      this.flowchartKeys.set(flowchartId, this.activeFlowchartKey);
      
      // Track the currently connected flowchart ID
      this.connectedFlowchartId = flowchartId;
      
      // Save to localStorage for persistence
      this.saveStoredKeys();
      
      // Set the active flowchart key in Redux
      store.dispatch(setActiveFlowchartKey(this.activeFlowchartKey));
      
      console.log(`Created new key for flowchart ${flowchartId}: ${this.activeFlowchartKey}`);
      
      // Join the swarm with this topic
      if (this.hyperswarm) {
        const topic = keyToTopic(this.activeFlowchartKey);
        this.hyperswarm.join(topic, { announce: true, lookup: true });
        console.log(`Joined Hyperswarm with topic for new flowchart key: ${this.activeFlowchartKey}`);
      }
      
      return this.activeFlowchartKey;
    } catch (error) {
      console.error('Failed to create shared flowchart:', error);
      store.dispatch(setSignalingError('Failed to create shared flowchart'));
      throw error;
    }
  }
  
  // Join an existing shared flowchart
  public async joinSharedFlowchart(hypercoreKey: string): Promise<boolean> {
    try {
      console.log(`Joining flowchart with key: ${hypercoreKey}`);
      
      // First, leave any existing flowchart topic
      if (this.hyperswarm && this.activeFlowchartKey && this.activeFlowchartKey !== hypercoreKey) {
        await this.hyperswarm.leave(keyToTopic(this.activeFlowchartKey));
        console.log(`Left previous flowchart topic: ${this.activeFlowchartKey}`);
      }
      
      // Set the new key
      this.activeFlowchartKey = hypercoreKey;
      
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
      
      // Mark this flowchart key as pending a data request
      this.pendingDataRequests.add(hypercoreKey);
      
      // Set connection status to connecting
      store.dispatch(setConnectionStatus(true));
      
      // Join the swarm with this topic
      if (this.hyperswarm) {
        const topic = keyToTopic(hypercoreKey);
        this.hyperswarm.join(topic, { announce: true, lookup: true });
        console.log(`Joined Hyperswarm with topic for flowchart key: ${hypercoreKey}`);
      } else {
        throw new Error('Hyperswarm is not initialized');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to join shared flowchart:', error);
      store.dispatch(setSignalingError('Failed to join shared flowchart'));
      return false;
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
    
    // Send updated user info to all connected peers
    this.streams.forEach((stream, peerId) => {
      this.sendToPeer(peerId, {
        type: 'user-info',
        info: userInfo
      });
    });
  }
  
  // Register callback for flowchart updates
  public onFlowchartUpdate(callback: (data: any) => void): void {
    this.flowchartUpdateCallback = callback;
    console.log('Flowchart update callback registered');
  }
  
  // Get the Hypercore key for a flowchart
  public getFlowchartKey(flowchartId: string): string | null {
    const key = this.flowchartKeys.get(flowchartId) || null;
    
    // Set the active flowchart key in Redux if we have one
    if (key) {
      store.dispatch(setActiveFlowchartKey(key));
    }
    
    return key;
  }
  
  // Send a flowchart update to all connected peers
  public sendFlowchartUpdate(flowchartData: any): void {
    console.log('Sending flowchart update to all peers');
    
    const message = {
      type: 'flowchart-update',
      data: flowchartData,
      timestamp: Date.now()
    };
    
    // Send to all connected peers
    let sentToAnyPeer = false;
    this.streams.forEach((stream, peerId) => {
      const success = this.sendToPeer(peerId, message);
      if (success) {
        sentToAnyPeer = true;
        console.log(`Sent flowchart update to peer: ${peerId}`);
      }
    });
    
    if (!sentToAnyPeer && this.streams.size > 0) {
      console.warn('Could not send flowchart update to any peer - none are connected');
    } else if (this.streams.size === 0) {
      console.log('No peers connected to send flowchart update to');
    }
  }
  
  // Send cursor position to all connected peers
  public sendCursorPosition(x: number, y: number): void {
    const message = {
      type: 'cursor-position',
      x,
      y,
      timestamp: Date.now()
    };
    
    // Send to all connected peers
    this.streams.forEach((stream, peerId) => {
      this.sendToPeer(peerId, message);
    });
  }
  
  // Clean up all connections
  public async cleanup(): Promise<void> {
    console.log('Cleaning up Hyperswarm connections');
    
    // Clear any pending data requests
    this.pendingDataRequests.clear();
    
    // Close all streams
    this.streams.forEach((stream, peerId) => {
      try {
        if (!stream.destroyed) {
          stream.destroy();
        }
      } catch (e) {
        console.error(`Error closing stream for peer ${peerId}:`, e);
      }
    });
    
    // Clear the maps
    this.streams.clear();
    this.dataChannels.clear();
    
    // Leave all topics and destroy hyperswarm
    if (this.hyperswarm) {
      try {
        if (this.activeFlowchartKey) {
          await this.hyperswarm.leave(keyToTopic(this.activeFlowchartKey));
        }
        await this.hyperswarm.destroy();
      } catch (e) {
        console.error('Error destroying hyperswarm:', e);
      }
      this.hyperswarm = null;
    }
    
    // Reset state
    this.activeFlowchartKey = null;
    this.connectionEstablished = false;
    this.connectedFlowchartId = null;
    
    // Update Redux store
    store.dispatch(setConnectionStatus(false));
    
    console.log('Hyperswarm connections cleaned up');
  }
}

// Create a singleton instance
const hyperswarmWebRTCService = new HyperswarmWebRTCService();

export default hyperswarmWebRTCService; 