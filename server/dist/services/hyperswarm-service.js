"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HyperswarmService = void 0;
const hyperswarm_1 = __importDefault(require("hyperswarm"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
/**
 * Service to handle Hyperswarm peer discovery and WebRTC signaling
 */
class HyperswarmService {
    constructor() {
        this.activeConnections = new Map();
        logger_1.logger.info('HyperswarmService initialized');
    }
    /**
     * Create a Hyperswarm topic from a room ID
     */
    getRoomTopic(roomId) {
        return crypto_1.default.createHash('sha256')
            .update(roomId)
            .digest();
    }
    /**
     * Join a swarm with a given key
     */
    async joinSwarm(key, socket) {
        try {
            logger_1.logger.info(`Joining swarm with key: ${key}`);
            // Create a new Hyperswarm instance
            const swarm = new hyperswarm_1.default();
            // Create topic from key
            const topic = this.getRoomTopic(key);
            logger_1.logger.info(`Created topic: ${topic.toString('hex')}`);
            // Create a unique connection ID
            const connectionId = (0, uuid_1.v4)();
            // Store connection info
            const swarmConnection = {
                id: connectionId,
                socketId: socket.id,
                socket,
                topic,
                connections: new Map()
            };
            this.activeConnections.set(socket.id, swarmConnection);
            // Join the DHT with the topic
            const discovery = swarm.join(topic, {
                server: true, // Accept connections as a server
                client: true // Actively connect to other peers
            });
            // Wait for DHT announce to complete
            await discovery.flushed();
            logger_1.logger.info(`Joined DHT for topic: ${topic.toString('hex')}`);
            // Handle incoming connections
            swarm.on('connection', (conn, info) => {
                this.handleSwarmConnection(swarmConnection, conn, info);
            });
            // Handle disconnections
            swarm.on('disconnection', (conn, info) => {
                this.handleSwarmDisconnection(swarmConnection, conn, info);
            });
            return { topic: topic.toString('hex') };
        }
        catch (error) {
            logger_1.logger.error(`Error joining swarm: ${error}`);
            throw error;
        }
    }
    /**
     * Handle a new Hyperswarm connection
     */
    handleSwarmConnection(swarmConnection, conn, info) {
        try {
            // Get peer ID as hex
            const peerId = info.publicKey.toString('hex');
            logger_1.logger.info(`New Hyperswarm connection from peer: ${peerId}`);
            // Store connection
            swarmConnection.connections.set(peerId, conn);
            // Notify client about the new peer
            swarmConnection.socket.emit('peer-connected', {
                id: peerId
            });
            // Handle incoming data from this peer
            conn.on('data', (data) => {
                try {
                    // Parse the message
                    const message = JSON.parse(data.toString());
                    // Handle based on message type
                    if (message.type === 'rtc-signal') {
                        logger_1.logger.info(`Received RTC signal from peer ${peerId}`);
                        // Forward the signal to the client
                        swarmConnection.socket.emit('signal-received', {
                            peerId,
                            signal: message.signal,
                            from: message.from
                        });
                    }
                    else {
                        logger_1.logger.info(`Received message from peer ${peerId}: ${message.type}`);
                    }
                }
                catch (error) {
                    logger_1.logger.error(`Error handling data from peer ${peerId}: ${error}`);
                }
            });
            // Handle connection errors
            conn.on('error', (error) => {
                logger_1.logger.error(`Connection error with peer ${peerId}: ${error.message}`);
            });
            // Handle connection close
            conn.on('close', () => {
                logger_1.logger.info(`Connection closed with peer ${peerId}`);
                swarmConnection.connections.delete(peerId);
                // Notify client
                swarmConnection.socket.emit('peer-disconnected', {
                    id: peerId
                });
            });
        }
        catch (error) {
            logger_1.logger.error(`Error handling connection: ${error}`);
        }
    }
    /**
     * Handle a Hyperswarm disconnection
     */
    handleSwarmDisconnection(swarmConnection, conn, info) {
        try {
            // Get peer ID as hex
            const peerId = info.publicKey.toString('hex');
            logger_1.logger.info(`Peer disconnected: ${peerId}`);
            // Remove from connections
            swarmConnection.connections.delete(peerId);
            // Notify client
            swarmConnection.socket.emit('peer-disconnected', {
                id: peerId
            });
        }
        catch (error) {
            logger_1.logger.error(`Error handling disconnection: ${error}`);
        }
    }
    /**
     * Leave a swarm
     */
    async leaveSwarm(socketId) {
        try {
            const swarmConnection = this.activeConnections.get(socketId);
            if (!swarmConnection) {
                logger_1.logger.warn(`No active connection found for socket: ${socketId}`);
                return;
            }
            logger_1.logger.info(`Leaving swarm for socket: ${socketId}`);
            // Close all peer connections
            for (const [peerId, conn] of swarmConnection.connections.entries()) {
                logger_1.logger.info(`Closing connection to peer: ${peerId}`);
                conn.destroy();
            }
            // Clear connections map
            swarmConnection.connections.clear();
            // Remove from active connections
            this.activeConnections.delete(socketId);
            logger_1.logger.info(`Successfully left swarm for socket: ${socketId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error leaving swarm: ${error}`);
            throw error;
        }
    }
    /**
     * Handle socket disconnection
     */
    handleSocketDisconnect(socketId) {
        this.leaveSwarm(socketId).catch((error) => {
            logger_1.logger.error(`Error handling socket disconnect: ${error}`);
        });
    }
    /**
     * Forward a WebRTC signal to a peer
     */
    forwardSignal(fromSocketId, toPeerId, signal) {
        try {
            const swarmConnection = this.activeConnections.get(fromSocketId);
            if (!swarmConnection) {
                logger_1.logger.warn(`No active connection found for socket: ${fromSocketId}`);
                return;
            }
            // Find the connection for this peer
            const connection = swarmConnection.connections.get(toPeerId);
            if (!connection) {
                logger_1.logger.warn(`No connection found for peer: ${toPeerId}`);
                return;
            }
            // Create signal message
            const signalMessage = {
                type: 'rtc-signal',
                from: fromSocketId,
                signal: signal,
                timestamp: Date.now()
            };
            // Send the signal
            connection.write(JSON.stringify(signalMessage));
            logger_1.logger.info(`Signal forwarded to peer: ${toPeerId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error forwarding signal: ${error}`);
        }
    }
}
exports.HyperswarmService = HyperswarmService;
//# sourceMappingURL=hyperswarm-service.js.map