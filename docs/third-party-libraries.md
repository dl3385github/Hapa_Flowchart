# Third-Party Libraries - Hapa Flowchart

## Overview

The Hapa Flowchart application leverages several third-party libraries to provide a robust, feature-rich experience while maintaining its focus on decentralization, privacy, and integration with the Hapa ecosystem. This document outlines the key libraries used, their purpose, licensing, and implementation considerations.

## Frontend Libraries

### Core UI Framework

| Library | Purpose | Version | License |
|---------|---------|---------|---------|
| [React](https://reactjs.org/) | Core UI framework | 18.2.0+ | MIT |
| [Vite](https://vitejs.dev/) | Build tool and dev server | 4.3.0+ | MIT |
| [TypeScript](https://www.typescriptlang.org/) | Type safety and developer experience | 5.0.0+ | Apache-2.0 |

### Flowchart Specific

| Library | Purpose | Version | License |
|---------|---------|---------|---------|
| [React Flow](https://reactflow.dev/) | Core flowchart visualization and interaction | 11.7.0+ | MIT |
| [D3.js](https://d3js.org/) | Advanced data visualization (optional) | 7.8.0+ | ISC |
| [dagre](https://github.com/dagrejs/dagre) | Automatic graph layout algorithms | 0.8.5+ | MIT |
| [elkjs](https://github.com/kieler/elkjs) | Alternative layout engine for complex flowcharts | 0.8.2+ | EPL-2.0 |

### State Management

| Library | Purpose | Version | License |
|---------|---------|---------|---------|
| [Redux Toolkit](https://redux-toolkit.js.org/) | Global state management | 1.9.0+ | MIT |
| [React Query](https://tanstack.com/query/latest) | Server state management for API data | 4.29.0+ | MIT |
| [Zustand](https://github.com/pmndrs/zustand) | Lightweight state for specific components (alternative) | 4.3.0+ | MIT |
| [Immer](https://immerjs.github.io/immer/) | Immutable state updates | 10.0.0+ | MIT |

### UI Components and Styling

| Library | Purpose | Version | License |
|---------|---------|---------|---------|
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework | 3.3.0+ | MIT |
| [Headless UI](https://headlessui.com/) | Unstyled accessible UI components | 1.7.0+ | MIT |
| [React Icons](https://react-icons.github.io/react-icons/) | Icon library | 4.8.0+ | MIT |
| [Framer Motion](https://www.framer.com/motion/) | Animation library | 10.12.0+ | MIT |

### P2P and Collaboration

| Library | Purpose | Version | License |
|---------|---------|---------|---------|
| [simple-peer](https://github.com/feross/simple-peer) | WebRTC simplified | 9.11.0+ | MIT |
| [y-webrtc](https://github.com/yjs/y-webrtc) | WebRTC connector for Yjs | 10.2.0+ | MIT |
| [Yjs](https://github.com/yjs/yjs) | CRDT for collaborative editing | 13.5.0+ | MIT |
| [y-indexeddb](https://github.com/yjs/y-indexeddb) | IndexedDB persistence for Yjs | 9.0.0+ | MIT |

## Backend/Node.js Libraries

### Hypercore Ecosystem

| Library | Purpose | Version | License |
|---------|---------|---------|---------|
| [Hypercore](https://github.com/hypercore-protocol/hypercore) | Append-only log data structure | 10.0.0+ | MIT |
| [Hyperbee](https://github.com/hypercore-protocol/hyperbee) | B-tree on Hypercore | 2.0.0+ | MIT |
| [Hyperswarm](https://github.com/hypercore-protocol/hyperswarm) | Distributed peer discovery | 4.0.0+ | MIT |
| [Corestore](https://github.com/hypercore-protocol/corestore) | Multiple Hypercore management | 6.0.0+ | MIT |

### Server and API

| Library | Purpose | Version | License |
|---------|---------|---------|---------|
| [Express](https://expressjs.com/) | Web server framework | 4.18.0+ | MIT |
| [Socket.IO](https://socket.io/) | WebSocket communication | 4.6.0+ | MIT |
| [Axios](https://axios-http.com/) | HTTP client | 1.3.0+ | MIT |
| [cors](https://github.com/expressjs/cors) | Cross-origin resource sharing | 2.8.0+ | MIT |

### Security and Authentication

| Library | Purpose | Version | License |
|---------|---------|---------|---------|
| [node-forge](https://github.com/digitalbazaar/forge) | Cryptographic operations | 1.3.0+ | (BSD-3-Clause OR GPL-2.0) |
| [tweetnacl](https://github.com/dchest/tweetnacl-js) | Cryptographic library for Ed25519 | 1.0.0+ | Public Domain |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | JWT implementation | 9.0.0+ | MIT |
| [did-jwt](https://github.com/decentralized-identity/did-jwt) | DID-based JWT | 7.0.0+ | Apache-2.0 |

### AI and Machine Learning

| Library | Purpose | Version | License |
|---------|---------|---------|---------|
| [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) | Node.js bindings for Llama.cpp | 0.1.0+ | MIT |
| [onnxruntime-node](https://github.com/microsoft/onnxruntime) | ONNX runtime for Node.js | 1.15.0+ | MIT |
| [ml-matrix](https://github.com/mljs/matrix) | Matrix operations for layout algorithms | 6.10.0+ | MIT |

## Testing Libraries

| Library | Purpose | Version | License |
|---------|---------|---------|---------|
| [Jest](https://jestjs.io/) | Testing framework | 29.5.0+ | MIT |
| [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) | React component testing | 14.0.0+ | MIT |
| [MSW](https://mswjs.io/) | API mocking | 1.2.0+ | MIT |
| [Playwright](https://playwright.dev/) | E2E testing | 1.33.0+ | Apache-2.0 |

## Development and Build Tools

| Library | Purpose | Version | License |
|---------|---------|---------|---------|
| [ESLint](https://eslint.org/) | Code linting | 8.39.0+ | MIT |
| [Prettier](https://prettier.io/) | Code formatting | 2.8.0+ | MIT |
| [Husky](https://typicode.github.io/husky/) | Git hooks | 8.0.0+ | MIT |
| [Workbox](https://developers.google.com/web/tools/workbox) | PWA service worker generation | 6.5.0+ | MIT |
| [vite-plugin-pwa](https://github.com/antfu/vite-plugin-pwa) | PWA integration for Vite | 0.16.0+ | MIT |

## Implementation Details

### Flowchart Core (React Flow)

React Flow is the primary library for flowchart visualization and interaction. It provides:

```jsx
// Example of React Flow implementation
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';

function FlowchartCanvas({ initialNodes, initialEdges }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={onNodesChange}
      edges={edges}
      onEdgesChange={onEdgesChange}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
```

### P2P Collaboration Stack

The P2P collaboration features use a combination of WebRTC (via simple-peer) and CRDTs (via Yjs):

```jsx
// Example of Yjs + WebRTC implementation
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';

function setupCollaboration(flowchartId) {
  // Create a Yjs document
  const ydoc = new Y.Doc();
  
  // Connect to WebRTC peers
  const provider = new WebrtcProvider(`hapa-flowchart-${flowchartId}`, ydoc);
  
  // Persist to IndexedDB
  const persistence = new IndexeddbPersistence(`hapa-flowchart-${flowchartId}`, ydoc);
  
  // Create shared data structures
  const yNodes = ydoc.getMap('nodes');
  const yEdges = ydoc.getMap('edges');
  const yMetadata = ydoc.getMap('metadata');
  
  return {
    ydoc,
    provider,
    persistence,
    yNodes,
    yEdges,
    yMetadata
  };
}
```

### Hypercore Integration

Hypercore provides the foundation for distributed, versioned storage:

```javascript
// Example of Hypercore implementation
const Hypercore = require('hypercore');
const Hyperbee = require('hyperbee');
const Hyperswarm = require('hyperswarm');
const crypto = require('crypto');

async function setupHypercore(flowchartId, options = {}) {
  // Create or load a Hypercore feed
  const feed = new Hypercore(`./data/flowcharts/${flowchartId}`, options.key, {
    valueEncoding: 'json',
    secretKey: options.secretKey
  });
  
  await feed.ready();
  
  // Create a Hyperbee database on top of the feed
  const db = new Hyperbee(feed, {
    keyEncoding: 'utf-8',
    valueEncoding: 'json'
  });
  
  await db.ready();
  
  // Set up replication via Hyperswarm
  const swarm = new Hyperswarm();
  const discoveryKey = crypto.createHash('sha256')
    .update(feed.key)
    .digest();
  
  swarm.join(discoveryKey, {
    lookup: true,
    announce: true
  });
  
  swarm.on('connection', (socket, info) => {
    // Replicate with peers
    const stream = feed.replicate(true, { live: true });
    socket.pipe(stream).pipe(socket);
  });
  
  return {
    feed,
    db,
    swarm,
    publicKey: feed.key.toString('hex')
  };
}
```

### Local AI Integration (Llama.cpp)

Integration with the Llama.cpp library for local AI features:

```javascript
// Example of node-llama-cpp implementation
const { LlamaModel, LlamaContext, LlamaChatSession } = require('node-llama-cpp');

async function setupLocalAI() {
  const model = new LlamaModel({
    modelPath: './models/llama-7b-flowchart.gguf'
  });
  
  const context = new LlamaContext({
    model,
    contextSize: 2048,
    batchSize: 512
  });
  
  const session = new LlamaChatSession({
    context,
    systemPrompt: 'You are a flowchart optimization assistant. Analyze flowcharts and suggest improvements.'
  });
  
  return {
    model,
    context,
    session,
    
    async getFlowchartSuggestions(flowchartData) {
      const prompt = `Analyze this flowchart data and suggest improvements:
        ${JSON.stringify(flowchartData, null, 2)}
        
        Provide 3-5 specific suggestions to improve this flowchart.
      `;
      
      const response = await session.prompt(prompt);
      return parseSuggestions(response);
    }
  };
}
```

## Library Selection Considerations

### Security and Privacy

- All selected libraries undergo security audits
- Preference for libraries with strong maintenance records
- Careful evaluation of transitive dependencies
- Focus on libraries that maintain privacy guarantees

### Performance

- Libraries optimized for handling large flowcharts
- Support for virtualization when displaying many nodes
- Efficient memory usage to prevent leaks in long sessions
- Fast initial load time for good UX

### License Compatibility

- All libraries use permissive licenses (MIT, Apache 2.0, etc.)
- License compliance verified for all production dependencies
- Attribution notices included as required
- No copyleft licenses that could restrict Hapa ecosystem

### Maintenance Status

- Active development community
- Recent releases and updates
- Responsive maintainers
- Good documentation and examples

## Integration with Hapa Ecosystem

### Hypercore Protocol

Hypercore is a core technology in the Hapa ecosystem, providing:

- **Distributed storage**: Data persists across the network
- **Versioning**: Complete history of flowchart changes
- **Cryptographic verification**: Ensures data integrity
- **Selective replication**: Only sync with authorized peers

### Task Manager Integration

Integration with Hapa Task Manager is built upon:

- **API client libraries**: Axios for REST API calls
- **WebSocket connections**: Socket.IO for real-time updates
- **JWT authentication**: For secure API access
- **DID resolution**: For identity verification

## Upgrade and Maintenance Strategy

- Regular dependency updates via automated tools
- Manual review of major version upgrades
- Comprehensive test suite to catch breaking changes
- Careful evaluation of new library additions
- Removal of unused or deprecated dependencies

## Installation Instructions

Installation is handled through package managers:

```bash
# Install dependencies
npm install

# Install platform-specific dependencies (like node-llama-cpp)
npm run install:platform

# Install development dependencies
npm install --save-dev
```

## Development Environment Setup

For local development:

```bash
# Start development server
npm run dev

# Run in Electron
npm run electron:dev

# Build for production
npm run build

# Package Electron app
npm run electron:build
``` 