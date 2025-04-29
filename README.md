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

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- ReactFlow for the core flowchart visualization
- Hypercore Protocol for decentralized data storage
- Hapa Task Manager for integration capabilities 