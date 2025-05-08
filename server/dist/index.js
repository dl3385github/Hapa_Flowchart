"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const socket_io_1 = require("socket.io");
const hyperswarm_service_1 = require("./services/hyperswarm-service");
const config_1 = require("./utils/config");
const logger_1 = require("./utils/logger");
const signal_routes_1 = __importDefault(require("./routes/signal-routes"));
// Initialize Express app
const app = (0, express_1.default)();
exports.app = app;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// API Routes
app.use('/api/signal', signal_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Create HTTP server
const server = http_1.default.createServer(app);
exports.server = server;
// Create Socket.IO server with CORS configured
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
// Initialize Hyperswarm service
const hyperswarmService = new hyperswarm_service_1.HyperswarmService();
// Handle socket connections
io.on('connection', (socket) => {
    logger_1.logger.info(`Socket connected: ${socket.id}`);
    // Handle client disconnection
    socket.on('disconnect', () => {
        logger_1.logger.info(`Socket disconnected: ${socket.id}`);
        hyperswarmService.handleSocketDisconnect(socket.id);
    });
    // Handle join requests
    socket.on('join-swarm', async (data) => {
        logger_1.logger.info(`Socket ${socket.id} joining swarm with key: ${data.key}`);
        try {
            const result = await hyperswarmService.joinSwarm(data.key, socket);
            socket.emit('swarm-joined', { success: true, topic: result.topic });
        }
        catch (error) {
            logger_1.logger.error(`Error joining swarm: ${error}`);
            socket.emit('swarm-joined', { success: false, error: error.message });
        }
    });
    // Handle leave requests
    socket.on('leave-swarm', async () => {
        logger_1.logger.info(`Socket ${socket.id} leaving swarm`);
        try {
            await hyperswarmService.leaveSwarm(socket.id);
            socket.emit('swarm-left', { success: true });
        }
        catch (error) {
            logger_1.logger.error(`Error leaving swarm: ${error}`);
            socket.emit('swarm-left', { success: false, error: error.message });
        }
    });
    // Handle WebRTC signaling
    socket.on('signal', (data) => {
        logger_1.logger.info(`Received signal from ${socket.id} for peer ${data.peerId}`);
        hyperswarmService.forwardSignal(socket.id, data.peerId, data.signal);
    });
});
// Start the server
const PORT = config_1.config.port;
server.listen(PORT, () => {
    logger_1.logger.info(`Server running on port ${PORT}`);
});
// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
    });
});
//# sourceMappingURL=index.js.map