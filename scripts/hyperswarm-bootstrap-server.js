#!/usr/bin/env node

/**
 * Hyperswarm Web Bootstrap Server
 * 
 * This script runs a hyperswarm-web server that acts as both a WebRTC signaling server 
 * and a WebSocket proxy for hyperswarm connections.
 * 
 * Usage:
 *   node hyperswarm-bootstrap-server.js [--port 4977]
 */

const hyperswarmWeb = require('hyperswarm-web/server');
const minimist = require('minimist');

// Parse command line arguments
const argv = minimist(process.argv.slice(2), {
  default: {
    port: 4977, // Default port is 4977 (HYPR on a phone keypad)
  },
  alias: {
    p: 'port',
    h: 'help',
  },
});

// Show help and exit if requested
if (argv.help) {
  console.log(`
Hyperswarm Web Bootstrap Server

Usage:
  node hyperswarm-bootstrap-server.js [options]

Options:
  -p, --port    Port to listen on (default: 4977)
  -h, --help    Show this help message
  `);
  process.exit(0);
}

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