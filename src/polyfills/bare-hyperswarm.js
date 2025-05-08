// Minimal Hyperswarm + WebRTC signaling implementation for browser environments
// Inspired by Hypercore's approach to P2P connections

// Global signaling bus to simulate DHT for browser environment
// This emulates how Hypercore handles signaling for WebRTC over Hyperswarm
const SIGNALING_BUS = window.HYPERSWARM_SIGNALING_BUS = window.HYPERSWARM_SIGNALING_BUS || {
  topics: new Map(), // Map<topicHex, Array<peerInfo>>
  signalChannels: new Map(), // Map<channelId, { source, target, messages }>
  connections: new Map(), // Map<peerId, Array<connectionInfo>>
  
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
      console.log(`[SignalingBus] Updated existing peer ${peer.id.slice(0, 6)} in topic ${topicHex.slice(0, 6)}`);
    } else {
      // Add new peer
      peers.push(peer);
      console.log(`[SignalingBus] Peer ${peer.id.slice(0, 6)} joined topic ${topicHex.slice(0, 6)}`);
      
      // Notify other peers about this new peer (after a short delay to ensure initialization)
      setTimeout(() => {
        // Check if peers still exists in the topic
        if (this.topics.has(topicHex)) {
          const currentPeers = this.topics.get(topicHex);
          if (currentPeers.some(p => p.id === peer.id)) {
            this.notifyPeerJoined(topicHex, peer);
          }
        }
      }, 100);
    }
    
    // Log all peers in this topic
    console.log(`[SignalingBus] Topic ${topicHex.slice(0, 6)} now has ${peers.length} peers: ${peers.map(p => p.id.slice(0, 6)).join(', ')}`);
    
    // Return existing peers for this topic (excluding self)
    return peers.filter(p => p.id !== peer.id);
  },
  
  // Remove a peer from a topic
  unregisterPeer(topicHex, peerId) {
    if (!this.topics.has(topicHex)) return;
    
    const peers = this.topics.get(topicHex);
    const peerIndex = peers.findIndex(p => p.id === peerId);
    
    if (peerIndex >= 0) {
      const peer = peers[peerIndex];
      peers.splice(peerIndex, 1);
      console.log(`[SignalingBus] Peer ${peerId.slice(0, 6)} left topic ${topicHex.slice(0, 6)}`);
      
      // Close any signal channels involving this peer
      this.closeSignalChannelsForPeer(peerId);
      
      // Notify other peers about this peer leaving
      this.notifyPeerLeft(topicHex, peer);
    }
  },
  
  // Notify peers when a new peer joins
  notifyPeerJoined(topicHex, newPeer) {
    if (!this.topics.has(topicHex)) return;
    
    const peers = this.topics.get(topicHex);
    
    // For each existing peer, establish a bidirectional signaling channel
    peers.forEach(peer => {
      if (peer.id !== newPeer.id) {
        // Create a unique channel ID for this peer pair
        const channelId = this.createChannelId(peer.id, newPeer.id);
        
        // Initialize the signaling channel
        if (!this.signalChannels.has(channelId)) {
          this.signalChannels.set(channelId, {
            peers: [peer.id, newPeer.id],
            messages: []
          });
          
          console.log(`[SignalingBus] Created signal channel ${channelId.slice(0, 8)} between peers ${peer.id.slice(0, 6)} and ${newPeer.id.slice(0, 6)}`);
          
          // Trigger connection events for both peers
          setTimeout(() => {
            // Create a simulated connection for peer
            const connForPeer = {
              peerConnection: true,
              remoteId: newPeer.id,
              write: (data) => this.sendSignal(peer.id, newPeer.id, data),
              channelId
            };
            
            // Create a simulated connection for new peer
            const connForNewPeer = {
              peerConnection: true,
              remoteId: peer.id,
              write: (data) => this.sendSignal(newPeer.id, peer.id, data),
              channelId
            };
            
            // Trigger connection events
            peer.instance.simulateConnection(connForPeer, { 
              publicKey: Buffer.from(newPeer.id, 'hex')
            });
            
            newPeer.instance.simulateConnection(connForNewPeer, { 
              publicKey: Buffer.from(peer.id, 'hex')
            });
          }, 50);
        }
      }
    });
  },
  
  // Notify peers when a peer leaves
  notifyPeerLeft(topicHex, departedPeer) {
    if (!this.topics.has(topicHex)) return;
    
    const peers = this.topics.get(topicHex);
    
    peers.forEach(peer => {
      if (peer.id !== departedPeer.id) {
        // Find channels involving both peers
        const channelId = this.createChannelId(peer.id, departedPeer.id);
        
        if (this.signalChannels.has(channelId)) {
          // Trigger disconnection event
          peer.instance.simulateDisconnection({}, { 
            publicKey: Buffer.from(departedPeer.id, 'hex')
          });
          
          // Remove the signal channel
          this.signalChannels.delete(channelId);
          console.log(`[SignalingBus] Removed signal channel ${channelId.slice(0, 8)}`);
        }
      }
    });
  },
  
  // Create a deterministic channel ID for two peers
  createChannelId(peerId1, peerId2) {
    // Sort peer IDs to ensure the same channel ID regardless of order
    const sortedIds = [peerId1, peerId2].sort();
    return `${sortedIds[0]}-${sortedIds[1]}`;
  },
  
  // Send a signal from one peer to another
  sendSignal(fromPeerId, toPeerId, data) {
    const channelId = this.createChannelId(fromPeerId, toPeerId);
    
    if (!this.signalChannels.has(channelId)) {
      console.warn(`[SignalingBus] No signal channel exists for ${channelId.slice(0, 8)}`);
      return;
    }
    
    // Find the target peer in any topic (we don't need to know which one)
    let targetPeer = null;
    
    for (const [_, peers] of this.topics.entries()) {
      targetPeer = peers.find(p => p.id === toPeerId);
      if (targetPeer) break;
    }
    
    if (!targetPeer) {
      console.warn(`[SignalingBus] Target peer ${toPeerId.slice(0, 6)} not found`);
      return;
    }
    
    // Record the message
    const channel = this.signalChannels.get(channelId);
    channel.messages.push({
      from: fromPeerId,
      to: toPeerId,
      data,
      timestamp: Date.now()
    });
    
    // Log the signal type if it's JSON
    try {
      const jsonData = JSON.parse(data.toString());
      console.log(`[SignalingBus] Signal from ${fromPeerId.slice(0, 6)} to ${toPeerId.slice(0, 6)}: ${jsonData.type || 'unknown'}`);
    } catch (e) {
      console.log(`[SignalingBus] Binary data signal from ${fromPeerId.slice(0, 6)} to ${toPeerId.slice(0, 6)}`);
    }
    
    // Deliver the message to the target with a small delay (simulating network)
    setTimeout(() => {
      // Deliver the signal to the recipient
      targetPeer.instance.receiveSignal({
        from: fromPeerId,
        data: Buffer.from(data)
      });
    }, 20);
  },
  
  // Close all signal channels for a specific peer
  closeSignalChannelsForPeer(peerId) {
    for (const [channelId, channel] of this.signalChannels.entries()) {
      if (channel.peers.includes(peerId)) {
        this.signalChannels.delete(channelId);
        console.log(`[SignalingBus] Closed signal channel ${channelId.slice(0, 8)} involving peer ${peerId.slice(0, 6)}`);
      }
    }
  },
  
  // Get all peers in a topic
  getPeers(topicHex) {
    if (!this.topics.has(topicHex)) return [];
    return this.topics.get(topicHex);
  }
};

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
  
  // Generate a random peer ID
  generateId() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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
    // This mimics the behavior of Hypercore's discovery process
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
            this.emit('connection', conn, { 
              publicKey: Buffer.from(peer.id, 'hex') 
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
  
  // Leave a DHT topic
  leave(topic) {
    const topicHex = Buffer.from(topic).toString('hex');
    
    console.log(`[Hyperswarm] Leaving topic ${topicHex.slice(0, 6)}`);
    
    // Unregister from the signaling bus
    SIGNALING_BUS.unregisterPeer(topicHex, this.id);
    
    // Remove the topic
    this.topics.delete(topicHex);
  }
  
  // Add an event listener
  on(event, callback) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(callback);
    }
    return this;
  }
  
  // Add a one-time event listener
  once(event, callback) {
    if (this.eventHandlers[event]) {
      const wrappedCallback = (...args) => {
        this.off(event, wrappedCallback);
        callback(...args);
      };
      this.eventHandlers[event].push(wrappedCallback);
    }
    return this;
  }
  
  // Remove an event listener
  off(event, callback) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(callback);
      if (index !== -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
    return this;
  }
  
  // Emit an event (internal use)
  emit(event, ...args) {
    if (this.eventHandlers[event]) {
      for (const callback of this.eventHandlers[event]) {
        callback(...args);
      }
    }
    return this;
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
    
    console.log(`[Hyperswarm] Connection with peer ${peerId.slice(0, 6)}`);
    
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
  
  // Simulate a disconnection (called by the signaling bus)
  simulateDisconnection(connection, info) {
    const peerId = info.publicKey.toString('hex');
    
    console.log(`[Hyperswarm] Disconnection from peer ${peerId.slice(0, 6)}`);
    
    // Remove the connection
    this.connections.delete(peerId);
    
    // Remove peer from all topics
    for (const [_, topicInfo] of this.topics.entries()) {
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