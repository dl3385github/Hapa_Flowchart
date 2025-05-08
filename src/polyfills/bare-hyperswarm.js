// Minimal Hyperswarm + WebRTC signaling implementation for browser environments
// Focused on cross-tab communication and proper WebRTC connection establishment

// Create a BroadcastChannel for signaling between browser tabs
const BROADCAST_CHANNEL = new BroadcastChannel('hapa-flowchart-signaling');

// Global registry to track peers and handle cross-tab communication
const SIGNALING_BUS = window.HYPERSWARM_SIGNALING_BUS = window.HYPERSWARM_SIGNALING_BUS || {
  topics: new Map(), // Map<topicHex, Array<peerInfo>>
  signalChannels: new Map(), // Map<channelId, { source, target, messages }>
  connections: new Map(), // Map<peerId, Array<connectionInfo>>
  instanceId: Math.random().toString(36).substring(2, 15),
  
  // Initialize the bus
  init() {
    // Set up broadcast channel message handling
    BROADCAST_CHANNEL.onmessage = (event) => {
      this.handleBroadcastMessage(event.data);
    };
    
    // Announce our presence
    this.broadcastMessage({
      type: 'instance-announce',
      instanceId: this.instanceId,
      timestamp: Date.now()
    });
    
    console.log(`[SignalingBus] Initialized with instance ID: ${this.instanceId}`);
    
    // Broadcast our topics when we start
    setTimeout(() => {
      this.broadcastTopics();
    }, 100);
  },
  
  // Send a message to all instances via BroadcastChannel
  broadcastMessage(message) {
    message.sender = this.instanceId;
    BROADCAST_CHANNEL.postMessage(message);
  },
  
  // Handle messages from other instances
  handleBroadcastMessage(message) {
    if (message.sender === this.instanceId) return; // Ignore our own messages
    
    console.log(`[SignalingBus] Received broadcast: ${message.type} from ${message.sender}`);
    
    switch (message.type) {
      case 'instance-announce':
        // When a new instance announces itself, share our topics with it
        this.broadcastTopics();
        break;
        
      case 'topic-announce':
        // A new topic has been announced by another instance
        this.handleRemoteTopicAnnounce(message);
        break;
        
      case 'peer-joined':
        // A new peer joined a topic in another instance
        this.handleRemotePeerJoined(message);
        break;
        
      case 'signal':
        // A WebRTC signaling message
        this.handleRemoteSignal(message);
        break;
    }
  },
  
  // Broadcast all our active topics
  broadcastTopics() {
    for (const [topicHex, peers] of this.topics.entries()) {
      this.broadcastMessage({
        type: 'topic-announce',
        topicHex,
        peers: peers.map(p => ({
          id: p.id,
          instanceId: this.instanceId
        }))
      });
    }
  },
  
  // Handle a topic announcement from another instance
  handleRemoteTopicAnnounce(message) {
    const { topicHex, peers } = message;
    
    // Check if we have a local instance interested in this topic
    if (this.topics.has(topicHex)) {
      console.log(`[SignalingBus] Remote instance ${message.sender} has topic ${topicHex.slice(0, 6)} with ${peers.length} peers`);
      
      const ourPeers = this.topics.get(topicHex);
      
      // For each of our peers, notify the remote instance and create channels with their peers
      ourPeers.forEach(localPeer => {
        // Announce our peer to the remote instance
        this.broadcastMessage({
          type: 'peer-joined',
          topicHex,
          peer: {
            id: localPeer.id,
            instanceId: this.instanceId
          }
        });
        
        // Create channels with each remote peer
        peers.forEach(remotePeer => {
          this.createSignalingChannel(localPeer, remotePeer, topicHex);
        });
      });
    }
  },
  
  // Handle a peer-joined event from another instance
  handleRemotePeerJoined(message) {
    const { topicHex, peer } = message;
    
    // Check if we have a local instance interested in this topic
    if (this.topics.has(topicHex)) {
      console.log(`[SignalingBus] Remote peer ${peer.id.slice(0, 6)} joined topic ${topicHex.slice(0, 6)}`);
      
      // Notify our local peers about this remote peer
      const ourPeers = this.topics.get(topicHex);
      
      ourPeers.forEach(localPeer => {
        // Create a simulated connection between the local peer and remote peer
        this.createSignalingChannel(localPeer, peer, topicHex);
      });
    }
  },
  
  // Create a signaling channel between a local and remote peer
  createSignalingChannel(localPeer, remotePeer, topicHex) {
    // Skip if it's the same peer (can happen with cross-tab instances)
    if (localPeer.id === remotePeer.id) {
      return;
    }
    
    const channelId = this.createChannelId(localPeer.id, remotePeer.id);
    
    // Only create the channel if it doesn't exist
    if (!this.signalChannels.has(channelId)) {
      console.log(`[SignalingBus] Creating signal channel ${channelId.slice(0, 8)} between local peer ${localPeer.id.slice(0, 6)} and remote peer ${remotePeer.id.slice(0, 6)}`);
      
      this.signalChannels.set(channelId, {
        peers: [localPeer.id, remotePeer.id],
        messages: [],
        localInstanceId: this.instanceId,
        remoteInstanceId: remotePeer.instanceId,
        topic: topicHex
      });
      
      // Create a simulated connection for the local peer
      const conn = {
        peerConnection: true,
        remoteId: remotePeer.id,
        channelId,
        write: (data) => {
          // Broadcast the signal to all instances
          this.broadcastMessage({
            type: 'signal',
            channelId,
            fromPeerId: localPeer.id,
            toPeerId: remotePeer.id,
            data
          });
        }
      };
      
      // Determine which side should initiate the connection
      // Using lexicographical comparison of peer IDs
      const shouldInitiate = localPeer.id < remotePeer.id;
      
      console.log(`[SignalingBus] Connection between ${localPeer.id.slice(0, 6)} and ${remotePeer.id.slice(0, 6)}, local peer ${shouldInitiate ? 'will' : 'will not'} initiate`);
      
      // Trigger connection event on local peer
      localPeer.instance.simulateConnection(conn, {
        publicKey: Buffer.from(remotePeer.id, 'hex'),
        shouldInitiate
      });
    }
  },
  
  // Handle a signaling message from another instance
  handleRemoteSignal(message) {
    const { channelId, fromPeerId, toPeerId, data } = message;
    
    // Check if we have the target peer locally
    let targetPeer = null;
    for (const [_, peers] of this.topics.entries()) {
      targetPeer = peers.find(p => p.id === toPeerId);
      if (targetPeer) break;
    }
    
    if (targetPeer) {
      console.log(`[SignalingBus] Delivering signal from peer ${fromPeerId.slice(0, 6)} to peer ${toPeerId.slice(0, 6)}`);
      
      // Deliver the signal to the local peer
      targetPeer.instance.receiveSignal({
        from: fromPeerId,
        data
      });
    }
  },
  
  // Register a peer on a topic
  registerPeer(topicHex, peer) {
    console.log(`[SignalingBus] Registering peer ${peer.id.slice(0, 6)} for topic ${topicHex.slice(0, 6)}`);
    
    if (!this.topics.has(topicHex)) {
      this.topics.set(topicHex, []);
    }
    
    const peers = this.topics.get(topicHex);
    const existingPeerIndex = peers.findIndex(p => p.id === peer.id);
    
    if (existingPeerIndex >= 0) {
      // Update existing peer
      peers[existingPeerIndex] = peer;
    } else {
      // Add new peer
      peers.push(peer);
      
      // Notify other instances
      this.notifyPeerJoined(topicHex, peer);
    }
    
    // Get all existing peers from other instances
    const remotePeers = [];
    for (const [channelId, channel] of this.signalChannels.entries()) {
      if (channel.topic === topicHex) {
        // Find the remote peer in this channel
        const remotePeerId = channel.peers.find(id => id !== peer.id);
        if (remotePeerId) {
          remotePeers.push({
            id: remotePeerId,
            instanceId: channel.localInstanceId === this.instanceId ? channel.remoteInstanceId : channel.localInstanceId
          });
        }
      }
    }
    
    return remotePeers;
  },
  
  // Unregister a peer from a topic
  unregisterPeer(topicHex, peerId) {
    console.log(`[SignalingBus] Unregistering peer ${peerId.slice(0, 6)} from topic ${topicHex.slice(0, 6)}`);
    
    if (this.topics.has(topicHex)) {
      const peers = this.topics.get(topicHex);
      const peerIndex = peers.findIndex(p => p.id === peerId);
      
      if (peerIndex >= 0) {
        const peer = peers[peerIndex];
        peers.splice(peerIndex, 1);
        
        // If no peers left, remove the topic
        if (peers.length === 0) {
          this.topics.delete(topicHex);
        }
        
        // Notify other instances
        this.notifyPeerLeft(topicHex, peer);
      }
    }
    
    // Clean up any signal channels for this peer
    this.closeSignalChannelsForPeer(peerId);
  },
  
  // Notify other instances of a new peer
  notifyPeerJoined(topicHex, newPeer) {
    this.broadcastMessage({
      type: 'peer-joined',
      topicHex,
      peer: {
        id: newPeer.id,
        instanceId: this.instanceId
      }
    });
  },
  
  // Notify other instances of a peer leaving
  notifyPeerLeft(topicHex, departedPeer) {
    this.broadcastMessage({
      type: 'peer-left',
      topicHex,
      peerId: departedPeer.id,
      instanceId: this.instanceId
    });
  },
  
  // Create a deterministic channel ID from two peer IDs
  createChannelId(peerId1, peerId2) {
    // Sort the IDs to ensure the same channel ID regardless of order
    const sortedIds = [peerId1, peerId2].sort();
    return `${sortedIds[0]}-${sortedIds[1]}`;
  },
  
  // Send a signal from one peer to another
  sendSignal(fromPeerId, toPeerId, data) {
    const channelId = this.createChannelId(fromPeerId, toPeerId);
    
    console.log(`[SignalingBus] Sending signal from ${fromPeerId.slice(0, 6)} to ${toPeerId.slice(0, 6)}`);
    
    // Broadcast to all instances
    this.broadcastMessage({
      type: 'signal',
      channelId,
      fromPeerId,
      toPeerId,
      data
    });
  },
  
  // Close all signal channels for a peer
  closeSignalChannelsForPeer(peerId) {
    // Find channels involving this peer
    const channelsToClose = [];
    
    for (const [channelId, channel] of this.signalChannels.entries()) {
      if (channel.peers.includes(peerId)) {
        channelsToClose.push(channelId);
      }
    }
    
    // Close the channels
    channelsToClose.forEach(channelId => {
      console.log(`[SignalingBus] Closing signal channel ${channelId}`);
      this.signalChannels.delete(channelId);
    });
  },
  
  // Get all peers for a topic
  getPeers(topicHex) {
    if (!this.topics.has(topicHex)) {
      return [];
    }
    
    return this.topics.get(topicHex);
  }
};

// Initialize the signaling bus
SIGNALING_BUS.init();

/**
 * A basic implementation of the Hyperswarm API for browser environments
 * This focuses on peer discovery and WebRTC signaling
 */
export class Hyperswarm {
  constructor(options = {}) {
    this.id = this.generateId();
    this.topics = new Map(); // Map of topic hex -> topic info
    this.connections = new Map(); // Map of peer ID -> connection
    this.eventHandlers = {
      connection: [],
      disconnection: [],
      data: [],
      error: []
    };
    this.options = options;
    
    console.log(`[Hyperswarm] Created instance with ID ${this.id.slice(0, 6)}`);
  }
  
  // Generate a random ID for this instance
  generateId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Join a DHT topic
  join(topic, options = {}) {
    const topicHex = Buffer.from(topic).toString('hex');
    
    console.log(`[Hyperswarm] Joining topic ${topicHex.slice(0, 6)}`);
    
    // Store topic info 
    this.topics.set(topicHex, {
      topic,
      options,
      peers: new Set()
    });
    
    // Register with the signaling bus and get existing peers
    const existingPeers = SIGNALING_BUS.registerPeer(topicHex, {
      id: this.id,
      instance: this,
      options
    });
    
    // If there are existing peers, simulate connections with them
    if (existingPeers.length > 0) {
      console.log(`[Hyperswarm] Found ${existingPeers.length} existing peers in topic ${topicHex.slice(0, 6)}`);
      
      // Process each peer with a slight delay to avoid overwhelming connections
      existingPeers.forEach((peer, index) => {
        setTimeout(() => {
          // Create a simulated connection
          const conn = {
            write: (data) => SIGNALING_BUS.sendSignal(this.id, peer.id, data),
            on: (event, callback) => {},
            peerConnection: true,
            remoteId: peer.id
          };
          
          // Store the connection
          this.connections.set(peer.id, conn);
          
          // Simulate a connection event with a small delay
          setTimeout(() => {
            // Determine which side should initiate based on peer IDs
            const shouldInitiate = this.id < peer.id;
            
            this.emit('connection', conn, { 
              publicKey: Buffer.from(peer.id, 'hex'),
              shouldInitiate
            });
          }, 50);
        }, index * 100); // Stagger connections by 100ms
      });
    }
    
    // Return a discovery object with a flushed method
    return {
      flushed: () => Promise.resolve()
    };
  }
  
  // Leave a topic
  leave(topic) {
    const topicHex = Buffer.from(topic).toString('hex');
    
    console.log(`[Hyperswarm] Leaving topic ${topicHex.slice(0, 6)}`);
    
    // Unregister from the signaling bus
    SIGNALING_BUS.unregisterPeer(topicHex, this.id);
    
    // Remove the topic
    this.topics.delete(topicHex);
    
    // Close connections to peers in this topic that are no longer needed
    for (const [peerId, conn] of this.connections.entries()) {
      let stillNeeded = false;
      
      // Check if this peer is still needed for other topics
      for (const [otherTopicHex, topicInfo] of this.topics.entries()) {
        if (topicInfo.peers.has(peerId)) {
          stillNeeded = true;
          break;
        }
      }
      
      // If not needed, close the connection
      if (!stillNeeded) {
        console.log(`[Hyperswarm] Closing connection to peer ${peerId.slice(0, 6)}`);
        this.simulateDisconnection(conn, { publicKey: Buffer.from(peerId, 'hex') });
        this.connections.delete(peerId);
      }
    }
  }
  
  // Event emitter methods
  on(event, callback) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
  }
  
  once(event, callback) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    const wrappedCallback = (...args) => {
      this.off(event, wrappedCallback);
      callback(...args);
    };
    
    this.eventHandlers[event].push(wrappedCallback);
  }
  
  off(event, callback) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(callback);
      if (index !== -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }
  
  emit(event, ...args) {
    if (this.eventHandlers[event]) {
      for (const callback of this.eventHandlers[event]) {
        try {
          callback(...args);
        } catch (err) {
          console.error(`Error in ${event} event handler:`, err);
        }
      }
    }
  }
  
  // Handle receiving signals (called by the signaling bus)
  receiveSignal({ from, data }) {
    if (!this.connections.has(from)) {
      console.warn(`[Hyperswarm] Received signal from unknown peer ${from.slice(0, 6)}`);
      return;
    }
    
    // Find the connection
    const connection = this.connections.get(from);
    
    // Emit data event with the connection and data
    this.emit('data', connection, data);
  }
  
  // Simulate a connection (called by the signaling bus)
  simulateConnection(connection, info) {
    const peerId = info.publicKey.toString('hex');
    
    console.log(`[Hyperswarm] Connection with peer ${peerId.slice(0, 6)}, ${info.shouldInitiate ? 'will' : 'will not'} initiate`);
    
    // Store the connection
    this.connections.set(peerId, connection);
    
    // Add peer to relevant topics
    for (const [topicHex, topicInfo] of this.topics.entries()) {
      // Check if the peer is in this topic
      const peers = SIGNALING_BUS.getPeers(topicHex);
      const peerInTopic = peers.some(p => p.id === peerId);
      
      if (peerInTopic) {
        topicInfo.peers.add(peerId);
      }
    }
    
    // Emit connection event
    this.emit('connection', connection, info);
  }
  
  // Simulate a disconnection
  simulateDisconnection(connection, info) {
    const peerId = info.publicKey.toString('hex');
    
    console.log(`[Hyperswarm] Disconnection from peer ${peerId.slice(0, 6)}`);
    
    // Remove peer from all topics
    for (const [topicHex, topicInfo] of this.topics.entries()) {
      topicInfo.peers.delete(peerId);
    }
    
    // Emit disconnection event
    this.emit('disconnection', connection, info);
  }
  
  // Destroy the hyperswarm instance
  async destroy() {
    console.log(`[Hyperswarm] Destroying instance ${this.id.slice(0, 6)}`);
    
    // Leave all topics
    for (const [topicHex, topicInfo] of this.topics.entries()) {
      const topic = Buffer.from(topicHex, 'hex');
      this.leave(topic);
    }
    
    // Clear all state
    this.topics.clear();
    this.connections.clear();
    for (const event in this.eventHandlers) {
      this.eventHandlers[event] = [];
    }
    
    return Promise.resolve();
  }
}

// Create a Buffer shim for browsers
if (typeof Buffer === 'undefined') {
  window.Buffer = {
    from: (input, encoding) => {
      if (typeof input === 'string') {
        if (encoding === 'hex') {
          // Convert hex string to Uint8Array
          const arr = new Uint8Array(input.length / 2);
          for (let i = 0; i < input.length; i += 2) {
            arr[i / 2] = parseInt(input.substring(i, i + 2), 16);
          }
          return arr;
        }
        // Default to UTF-8
        return new TextEncoder().encode(input);
      }
      return input;
    }
  };
}

// Export a DHT class with the same API as hyperswarm's DHT
export class DHT {
  constructor(opts = {}) {
    this.options = opts;
  }
  
  async lookup(key) {
    return [];
  }
  
  async bootstrap(nodes = []) {
    return;
  }
  
  async destroy() {
    return;
  }
} 