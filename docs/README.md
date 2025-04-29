# Hapa Flowchart Documentation

## Overview

Hapa Flowchart is a decentralized, privacy-focused flowchart creation and collaboration tool designed to work seamlessly with the Hapa ecosystem, particularly the Hapa Task Manager. This application enables users to create, edit, and share flowcharts in a peer-to-peer environment, with strong emphasis on data ownership, privacy, and integration with Hapa's unique features like Consul governance and cryptocurrency incentives.

## Key Features

- **Decentralized Storage**: Flowcharts are stored using Hypercore/Hyperbee for distributed, versioned data
- **P2P Collaboration**: Real-time collaboration through WebRTC with no central server
- **Hapa Task Manager Integration**: Seamlessly connect flowchart elements to tasks in Hapa Task Manager
- **Local AI Assistance**: Built-in Gatekeeper functionality using local Llama.cpp for privacy-preserving suggestions
- **Version History**: Complete audit trail of all changes with restoration capabilities
- **Crypto Incentives**: Integration with Hapa's μCredit rewards system (for future phases)
- **Offline-First**: Full functionality even without internet connectivity

## Technology Stack

- **Frontend**: React.js with Electron for desktop applications
- **Flowchart Engine**: React Flow library for node-based diagrams
- **State Management**: Redux Toolkit + React Query
- **P2P Connectivity**: WebRTC via simple-peer library
- **Storage**: Hypercore Protocol for distributed storage
- **AI Features**: Local Llama.cpp for suggestion generation

## Documentation Index

This folder contains comprehensive documentation for the Hapa Flowchart application:

1. [Product Requirements](product-requirements.md) - Defines core features, user flows, and success metrics
2. [Frontend Documentation](frontend-documentation.md) - Details UI architecture, components, and state management
3. [Backend Specifications](backend-specifications.md) - Explains server architecture, API design, and security implementation
4. [API Specifications](api-specifications.md) - Describes endpoints, request/response formats, and error handling
5. [Database Schema](database-schema.md) - Outlines data models, relationships, and storage approach
6. [User Flow](user-flow.md) - Maps user journeys through the application for key tasks
7. [Third-Party Libraries](third-party-libraries.md) - Lists external dependencies, their purposes, and implementation details

## Phased Implementation

The Hapa Flowchart will be developed in phases:

### Phase 1: Core Features (MVP)
- Basic flowchart creation and editing functionality
- Local storage with Hypercore
- Simple Task Manager integration for viewing tasks
- Manual sharing via Hypercore keys

### Phase 2: Collaboration and AI
- Real-time collaboration with WebRTC
- Local AI suggestions with Llama.cpp
- Deeper Task Manager integration with bidirectional updates
- Enhanced version history and conflict resolution

### Phase 3: Advanced Features
- Crypto incentives integration (μCredits)
- GPU Burst for complex operations
- Consul voting for flowchart governance
- Advanced analytics and optimization

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Hapa Flowchart App                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │  Frontend    │  │ Local Node.js │  │    Hypercore       │    │
│  │  React App   ├──┤    Server    ├──┤  (Local Storage)    │    │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬───────────┘    │
│         │                 │                    │                 │
│         └─────────────────┼────────────────────┘                 │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
    ┌───────────▼──────────┐   ┌────────▼────────┐
    │    Hapa Task Manager │   │   Other Peers   │
    │        API           │   │  (via WebRTC)   │
    └────────────────────┬─┘   └────────┬────────┘
                         │              │
                         └──────────────┘
```

## Getting Started

### For Developers

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   npm run install:platform  # For platform-specific dependencies
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. For Electron development:
   ```
   npm run electron:dev
   ```

### For Users

1. Download the installer for your platform
2. Install and launch the application
3. Create a new flowchart or connect to Hapa Task Manager
4. (Optional) Set up P2P collaboration by sharing your flowchart key

## Contributing

Please refer to the [CONTRIBUTING.md](../CONTRIBUTING.md) file for guidelines on how to contribute to this project.

## License

Hapa Flowchart is licensed under [MIT License](../LICENSE). 