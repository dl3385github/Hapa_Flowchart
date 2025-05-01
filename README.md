# Hapa Flowchart

A decentralized, privacy-focused tool for creating and collaborating on flowcharts, integrated with the Hapa ecosystem.

## Overview

Hapa Flowchart is a powerful, intuitive flowchart creation tool built with privacy and decentralization at its core. It leverages the Hypercore Protocol for distributed data storage and WebRTC for real-time peer-to-peer collaboration, allowing users to work together without relying on centralized servers.

## Key Features

- **Intuitive Flowchart Creation**: Create professional flowcharts with a drag-and-drop interface
- **P2P Collaboration**: Work with others in real-time using WebRTC and conflict-free replicated data types
- **Integration with Hapa Task Manager**: Connect flowchart nodes directly to tasks in the Hapa ecosystem
- **Versioned History**: Track changes and revert to previous versions of your flowcharts
- **Privacy-First Approach**: End-to-end encryption ensures your data remains private
- **Decentralized Storage**: Powered by Hypercore Protocol for resilient, distributed data storage
- **Offline Functionality**: Create and edit flowcharts even without an internet connection

## Documentation

- [Product Requirements](docs/product-requirements.md)
- [Frontend Documentation](docs/frontend.md)
- [Backend Specifications](docs/backend-specifications.md)
- [API Specifications](docs/api-specifications.md)
- [User Flow](docs/user-flow.md)

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/hapaorg/hapa-flowchart.git
   cd hapa-flowchart
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Usage

### Creating a Flowchart

1. Navigate to the Dashboard
2. Click "New Flowchart"
3. Give your flowchart a name and description
4. Drag nodes from the sidebar onto the canvas
5. Connect nodes by dragging from one node's handle to another
6. Edit node properties by selecting a node and using the property panel

### Collaborating

1. Open a flowchart
2. Click the "Share" button in the toolbar
3. Copy the Hypercore key and share it with collaborators
4. Collaborators can paste the key to join your session

### Exporting/Importing

1. Use the toolbar to export your flowchart in various formats (SVG, PNG, JSON)
2. Import existing flowcharts by uploading JSON files or connecting to a shared Hypercore key

## Decentralized P2P Connection with Hyperswarm

Hapa Flowchart now uses the Hyperswarm DHT (Distributed Hash Table) for true peer-to-peer discovery and WebRTC for direct connections between peers. This enables real-time collaboration on flowcharts without relying on central servers.

### How It Works

1. When a user creates or joins a flowchart, a unique key is generated or used.
2. This key is used to discover other peers in the Hyperswarm DHT network.
3. Once peers are discovered, WebRTC connections are established directly between them.
4. Flowchart data and edits are shared directly between peers.

### Running a Bootstrap Server

For optimal performance in production, you should run your own bootstrap server:

```bash
# Install dependencies
npm install

# Run the bootstrap server (default port: 4977)
npm run bootstrap-server

# Run with a custom port
npm run bootstrap-server -- --port 8000
```

The bootstrap server provides two services:
- WebRTC signaling for peer discovery: `ws://your-server:4977/signal`
- WebSocket proxy for DHT communication: `ws://your-server:4977/proxy`

### Configuring Bootstrap Servers

To use your own bootstrap servers, modify the `BOOTSTRAP_SERVERS` array in `src/services/HyperswarmWebRTCService.ts`:

```typescript
const BOOTSTRAP_SERVERS = [
  'ws://your-server:4977',  // Your primary bootstrap server
  'ws://backup-server:4977', // Backup server
  'wss://public-server.example.com' // Public bootstrap server with SSL
];
```

For production use, it's recommended to:
1. Run multiple bootstrap servers for redundancy
2. Use secure WebSocket connections (wss://) with valid SSL certificates
3. Deploy bootstrap servers in different geographic regions for better performance

### Collaborative Editing

When multiple users join the same flowchart (using the same key), they can edit it simultaneously:

1. Each change is broadcast directly to all connected peers
2. The Yjs CRDT algorithm handles conflict resolution automatically
3. Users can see each other's cursor positions in real-time

This decentralized approach ensures your flowcharts remain private and accessible even without internet access to central servers.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- ReactFlow for the core flowchart visualization
- Hypercore Protocol for decentralized data storage
- Hapa Task Manager for integration capabilities 