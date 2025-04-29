# Hapa Flowchart

A decentralized, privacy-focused flowchart creation and collaboration tool integrated with the Hapa ecosystem.

![Hapa Flowchart](https://via.placeholder.com/800x400?text=Hapa+Flowchart)

## Overview

Hapa Flowchart is a standalone application that enables users to create, edit, and share flowcharts in a peer-to-peer environment. It integrates with Hapa Task Manager to provide a seamless workflow for visualizing and planning tasks. With its emphasis on privacy, decentralization, and collaboration, Hapa Flowchart aligns with the core principles of the Hapa ecosystem.

## Key Features

- **Intuitive Flowchart Creation**: Drag-and-drop interface for building flowcharts
- **P2P Collaboration**: Work together in real-time without centralized servers
- **Hapa Task Manager Integration**: Link flowchart nodes to tasks for comprehensive project visualization
- **Versioned History**: Track all changes with complete audit trail
- **Privacy-First**: Local AI processing via Gatekeeper with no data leaving your device
- **Decentralized Storage**: Powered by Hypercore Protocol for distributed, secure storage
- **Offline-First**: Full functionality even without internet connectivity

## Documentation

For comprehensive documentation, please refer to the [docs folder](docs/README.md).

- [Product Requirements](docs/product-requirements.md)
- [Frontend Documentation](docs/frontend-documentation.md)
- [Backend Specifications](docs/backend-specifications.md)
- [API Specifications](docs/api-specifications.md)
- [Database Schema](docs/database-schema.md)
- [User Flow](docs/user-flow.md)
- [Third-Party Libraries](docs/third-party-libraries.md)

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/hapanetwork/hapa-flowchart.git
   cd hapa-flowchart
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. (Optional) Install platform-specific dependencies:
   ```
   npm run install:platform
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. For Electron development:
   ```
   npm run electron:dev
   ```

### Building for Production

```
npm run build
npm run electron:build
```

## Usage

1. **Create a new flowchart**: Start from scratch or use a template
2. **Edit flowchart**: Add nodes, connections, and customize properties
3. **Connect to Hapa Task Manager**: Link nodes to specific tasks
4. **Collaborate**: Share your flowchart via Hypercore key or through Task Manager
5. **Export/Import**: Save your work in various formats (JSON, SVG, PNG)

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Hapa Network for the ecosystem infrastructure
- Hypercore Protocol for the distributed storage technology
- React Flow for the flowchart visualization foundation
- All contributors and community members 