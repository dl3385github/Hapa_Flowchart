#!/usr/bin/env node


// Start the server
const port = parseInt(argv.port, 10);
const server = hyperswarmWeb.createServer({
  port,
  verifyClient: (info) => {
    // Optional verification logic - can be used to restrict access
    console.log(`Client connecting from ${info.req.socket.remoteAddress}`);
    return true; // Allow all clients for now
  }
});

// Log successful startup
console.log(`Hyperswarm Web bootstrap server running on port ${port}`);
console.log(`WebRTC signaling: ws://localhost:${port}/signal`);
console.log(`WebSocket proxy: ws://localhost:${port}/proxy`);

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Make the server robust by handling uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Don't exit the process to keep the server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit the process to keep the server running
}); 