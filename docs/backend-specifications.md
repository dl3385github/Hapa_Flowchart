# Backend Specifications - Hapa Flowchart

## Architecture Overview

The Hapa Flowchart backend is designed with a focus on decentralization, privacy, and integration with the broader Hapa ecosystem. It uses a hybrid approach that combines local-first data storage with peer-to-peer synchronization, while also providing integration points with the Hapa Task Manager.

### Key Components

1. **Node.js Server**: Provides API endpoints for task integration and facilitates initial P2P connections
2. **Hypercore Protocol**: Core data storage and replication system
3. **WebRTC Signaling**: Enables direct peer-to-peer connections between collaborators
4. **Local AI Module**: Implements Gatekeeper functionality using Llama.cpp

### System Architecture Diagram

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

## Data Storage

The application uses a multi-layered storage approach:

### Hypercore/Hyperbee

Hypercore provides the foundation for distributed, secure, and versioned data storage with the following characteristics:

- **Feed-based**: Append-only logs for storing flowchart versions
- **Merkle-Tree**: Cryptographic verification of data integrity
- **P2P Replication**: Only replicate with authorized peers

Implementation details:

```javascript
// src/services/hypercore.js
const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const crypto = require('hypercore-crypto')

// Create a hypercore for a specific flowchart
async function createFlowchartFeed(id, options = {}) {
  const keyPair = options.keyPair || crypto.keyPair()
  const feed = new Hypercore(`./data/flowcharts/${id}`, keyPair.publicKey, {
    valueEncoding: 'json',
    secretKey: keyPair.secretKey
  })
  
  // Create a Hyperbee database on top of the feed
  const db = new Hyperbee(feed, {
    keyEncoding: 'utf-8',
    valueEncoding: 'json'
  })
  
  await db.ready()
  
  return {
    feed,
    db,
    publicKey: keyPair.publicKey.toString('hex')
  }
}

module.exports = {
  createFlowchartFeed
}
```

### IndexedDB

Used for client-side caching and offline support:

- Stores local copy of flowchart data
- Caches task information from Hapa Task Manager
- Tracks pending changes when offline

## API Endpoints

The backend exposes the following RESTful API endpoints:

### Flowchart Management

| Endpoint                     | Method | Description                                    | Request Body                                | Response                                     |
|------------------------------|--------|------------------------------------------------|---------------------------------------------|----------------------------------------------|
| `/api/flowcharts`            | GET    | List all flowcharts the user has access to     | -                                           | `{ flowcharts: [{ id, name, lastModified }]` |
| `/api/flowcharts`            | POST   | Create a new flowchart                         | `{ name, description, initialData }`        | `{ id, publicKey }`                          |
| `/api/flowcharts/:id`        | GET    | Get flowchart data                             | -                                           | `{ id, data, metadata }`                     |
| `/api/flowcharts/:id`        | PUT    | Update flowchart metadata                      | `{ name, description }`                     | `{ id, updated }`                            |
| `/api/flowcharts/:id/export` | GET    | Export flowchart in specified format           | Format as query param                       | Binary file or JSON                          |
| `/api/flowcharts/:id/share`  | POST   | Share flowchart with specific users            | `{ dids: ["did:1", "did:2"] }`             | `{ success, shareLink }`                     |

### Task Manager Integration

| Endpoint                      | Method | Description                                | Request Body                         | Response                                 |
|-------------------------------|--------|--------------------------------------------|--------------------------------------|------------------------------------------|
| `/api/tasks`                  | GET    | Get tasks from Hapa Task Manager           | -                                    | `{ tasks: [{ id, title, status, ... }] }`|
| `/api/tasks/:id`              | GET    | Get details for a specific task            | -                                    | `{ id, title, description, members, ... }`|
| `/api/flowcharts/:id/tasks`   | POST   | Link a task to a flowchart                 | `{ taskId, nodeId }`                 | `{ success }`                            |
| `/api/flowcharts/:id/tasks`   | GET    | Get all tasks linked to a flowchart        | -                                    | `{ tasks: [{ id, nodeId, ... }] }`       |

### Collaboration

| Endpoint                        | Method | Description                                  | Request Body                          | Response                                |
|---------------------------------|--------|----------------------------------------------|--------------------------------------|----------------------------------------|
| `/api/flowcharts/:id/signal`    | POST   | Send WebRTC signaling data to a peer         | `{ peerId, signal, metadata }`        | `{ success }`                           |
| `/api/flowcharts/:id/peers`     | GET    | Get currently connected peers                | -                                     | `{ peers: [{ id, did, lastSeen }] }`    |
| `/api/hyperswarm/join`          | POST   | Join a Hyperswarm with a specific topic key  | `{ topic }`                           | `{ success, peerId }`                   |

### AI Features (Gatekeeper)

| Endpoint                             | Method | Description                                   | Request Body                           | Response                                 |
|--------------------------------------|--------|-----------------------------------------------|---------------------------------------|------------------------------------------|
| `/api/flowcharts/:id/suggestions`    | POST   | Get AI suggestions for flowchart improvement  | `{ flowchartData }`                    | `{ suggestions: [{ type, description }] }`|
| `/api/flowcharts/:id/auto-layout`    | POST   | Apply AI-powered layout optimization          | `{ algorithm: "balanced"|"compact" }`  | `{ updatedPositions: { nodeId: {x,y} } }`|

## Data Models

### Flowchart Schema

```javascript
// Flowchart schema
{
  id: String,                // Unique identifier
  name: String,              // Flowchart title
  description: String,       // Optional description
  createdAt: Date,           // Creation timestamp
  updatedAt: Date,           // Last update timestamp
  createdBy: String,         // DID of creator (if available)
  version: Number,           // Current version number
  public: Boolean,           // Whether the flowchart is publicly accessible
  hypercoreKey: String,      // Public key of the Hypercore feed
  nodes: [{                  // Array of flowchart nodes
    id: String,              // Unique node identifier
    type: String,            // Node type (e.g., "task", "decision", "process")
    position: {              // Position on canvas
      x: Number,
      y: Number
    },
    data: {                  // Node-specific data
      label: String,         // Display text
      taskId: String,        // Reference to Task Manager task (optional)
      properties: Object     // Additional properties
    },
    style: Object            // Visual styling options
  }],
  edges: [{                  // Array of connections between nodes
    id: String,              // Unique edge identifier
    source: String,          // ID of source node
    target: String,          // ID of target node
    type: String,            // Edge type (e.g., "default", "step", "conditional")
    animated: Boolean,       // Whether the edge has animation
    label: String,           // Optional label text
    style: Object            // Visual styling options
  }],
  permissions: [{            // Access control
    did: String,             // DID of user
    role: String,            // "owner", "editor", "viewer"
    grantedAt: Date          // When permission was granted
  }],
  linkedTasks: [{            // Tasks linked to this flowchart
    taskId: String,          // Task ID in Hapa Task Manager
    nodeId: String,          // Node ID in the flowchart
    linkedAt: Date           // When the link was created
  }],
  metadata: {                // Additional metadata
    tags: [String],          // Searchable tags
    consulId: String,        // ID of associated Consul (if any)
    cryptoMetadata: {        // Crypto-economic data
      rewards: Number,       // µCredits earned from this flowchart
      staked: Number         // Bananas staked on this flowchart
    }
  }
}
```

### Version History Schema

Each version of a flowchart is stored in the Hypercore feed with metadata:

```javascript
// Version entry
{
  version: Number,           // Sequential version number
  timestamp: Date,           // When this version was created
  author: String,            // DID of user who made the change
  changes: {                 // Summary of changes
    nodesAdded: [String],    // IDs of added nodes
    nodesRemoved: [String],  // IDs of removed nodes
    nodesModified: [String], // IDs of modified nodes
    edgesAdded: [String],    // IDs of added edges
    edgesRemoved: [String],  // IDs of removed edges
    edgesModified: [String], // IDs of modified edges
  },
  snapshot: Object,          // Complete flowchart data at this version
  signature: String          // Ed25519 signature of the version data
}
```

### Task Integration Schema

Structure for data fetched from Hapa Task Manager:

```javascript
// Task schema (from Hapa Task Manager)
{
  id: String,                // Task ID in Hapa Task Manager
  title: String,             // Task title
  description: String,       // Detailed description
  status: String,            // Current status (e.g., "pending", "in-progress", "completed")
  createdAt: Date,           // Creation timestamp
  updatedAt: Date,           // Last update timestamp
  deadline: Date,            // Due date (if any)
  priority: Number,          // Priority level (1-5)
  assignedTo: [String],      // DIDs of assigned users
  creator: String,           // DID of task creator
  consulVotes: {             // Voting information
    required: Number,        // Votes needed for approval
    received: Number,        // Votes received
    approved: Boolean        // Whether task is approved
  },
  rewards: {                 // Crypto rewards
    µCredits: Number,        // µCredits allocated for completion
    distribution: {          // How rewards are distributed
      contributors: Number,  // Percentage to contributors
      auditors: Number,      // Percentage to auditors
      builder: Number        // Percentage to builder fund
    }
  },
  metadata: Object           // Additional task metadata
}
```

## Security Implementation

### Encryption & Authentication

1. **Data Encryption:**
   - All flowchart data is encrypted using AES-256-GCM
   - Encryption keys are derived from the Hypercore secret key
   - Content is encrypted before being written to Hypercore

2. **Identity Verification:**
   - Ed25519 signatures verify the authenticity of changes
   - Public keys are associated with DIDs when available
   - Signatures are stored with each version in the Hypercore

```javascript
// Example encryption implementation
const crypto = require('crypto')

function encryptFlowchartData(data, encryptionKey) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv)
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  }
}

function decryptFlowchartData(encryptedData, encryptionKey) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey,
    Buffer.from(encryptedData.iv, 'base64')
  )
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'))
  
  let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return JSON.parse(decrypted)
}
```

### Permission Management

1. **Role-Based Access Control:**
   - Owner: Full control over flowchart and permissions
   - Editor: Can modify flowchart content
   - Viewer: Read-only access

2. **Consul Voting Integration:**
   - Major changes can require Consul votes for approval
   - Voting records stored in Hypercore feed

## Hyperswarm Integration

The application uses Hyperswarm for peer discovery and WebRTC for direct connections:

```javascript
// src/services/hyperswarm.js
const Hyperswarm = require('hyperswarm')
const crypto = require('crypto')

function createSwarm(topicKey) {
  const swarm = new Hyperswarm()
  
  // Create a discovery key from the topic
  const discoveryKey = crypto.createHash('sha256')
    .update(topicKey)
    .digest()
  
  // Join the swarm with the discovery key
  swarm.join(discoveryKey, {
    lookup: true,   // Find other peers
    announce: true  // Announce our presence
  })
  
  return swarm
}

function setupWebRTCSignaling(swarm, onPeerConnect) {
  swarm.on('connection', (connection, info) => {
    // Handle new peer connection
    const { publicKey } = info
    
    // Set up WebRTC signaling over this connection
    connection.on('data', data => {
      const message = JSON.parse(data.toString())
      if (message.type === 'webrtc-signal') {
        // Forward to appropriate handler
        onPeerConnect(message.data, publicKey)
      }
    })
  })
}
```

## Task Manager Integration

### API Client

The Task Manager API client allows the Flowchart app to fetch task data and create task-flowchart linkages:

```javascript
// src/services/taskManagerApi.js
const axios = require('axios')

class TaskManagerClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || process.env.TASK_MANAGER_API_URL
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000
    })
  }
  
  // Get tasks the user has access to
  async getUserTasks() {
    try {
      const response = await this.client.get('/api/tasks')
      return response.data.tasks
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      throw error
    }
  }
  
  // Get details for a specific task
  async getTaskDetails(taskId) {
    try {
      const response = await this.client.get(`/api/tasks/${taskId}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch task ${taskId}:`, error)
      throw error
    }
  }
  
  // Link a task to a flowchart node
  async linkTaskToFlowchart(taskId, flowchartId, nodeId) {
    try {
      const response = await this.client.post(`/api/tasks/${taskId}/links`, {
        flowchartId,
        nodeId
      })
      return response.data
    } catch (error) {
      console.error(`Failed to link task ${taskId} to flowchart:`, error)
      throw error
    }
  }
  
  // Get DIDs of users with access to a task
  async getTaskMembers(taskId) {
    try {
      const response = await this.client.get(`/api/tasks/${taskId}/members`)
      return response.data.members
    } catch (error) {
      console.error(`Failed to fetch members for task ${taskId}:`, error)
      throw error
    }
  }
}

module.exports = TaskManagerClient
```

## Local AI Integration (Gatekeeper)

The application uses Llama.cpp for local AI processing:

```javascript
// src/services/gatekeeper.js
const { LlamaModel, LlamaContext } = require('node-llama-cpp')

class GatekeeperService {
  constructor(modelPath) {
    this.modelPath = modelPath || process.env.LLAMA_MODEL_PATH
    this.model = null
    this.initialized = false
  }
  
  async initialize() {
    if (this.initialized) return
    
    try {
      this.model = new LlamaModel({
        modelPath: this.modelPath
      })
      
      this.context = new LlamaContext({
        model: this.model,
        contextSize: 2048
      })
      
      this.initialized = true
      console.log('Gatekeeper AI initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Gatekeeper AI:', error)
      throw error
    }
  }
  
  async suggestFlowchartImprovements(flowchartData) {
    await this.initialize()
    
    // Prepare prompt for flowchart optimization
    const prompt = this.buildFlowchartPrompt(flowchartData)
    
    // Generate suggestions
    const completion = await this.context.completion(prompt, {
      maxTokens: 512,
      temperature: 0.7,
      topP: 0.95,
      stopStrings: ['###']
    })
    
    // Parse suggestions from completion
    return this.parseSuggestions(completion)
  }
  
  buildFlowchartPrompt(flowchartData) {
    // Convert flowchart data to a text description for the LLM
    // ...implementation details...
    
    return `
    You are a flowchart optimization assistant. Analyze this flowchart and suggest improvements:
    
    Nodes: ${JSON.stringify(flowchartData.nodes)}
    Edges: ${JSON.stringify(flowchartData.edges)}
    
    Provide 3-5 specific suggestions to improve this flowchart's clarity, efficiency, or organization.
    Format each suggestion as: [TYPE]: [DESCRIPTION]
    
    Examples of types: LAYOUT, CONNECTION, GROUPING, NAMING, SIMPLIFICATION
    
    ###
    `
  }
  
  parseSuggestions(completion) {
    // Parse the AI completion into structured suggestions
    // ...implementation details...
    
    const suggestions = []
    const lines = completion.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      const match = line.match(/([A-Z]+):\s+(.+)/)
      if (match) {
        suggestions.push({
          type: match[1],
          description: match[2]
        })
      }
    }
    
    return suggestions
  }
}

module.exports = GatekeeperService
```

## Performance Considerations

The backend is optimized for:

1. **Low Latency**:
   - WebSocket connections for real-time updates
   - In-memory caching of frequently accessed data
   - Efficient WebRTC data channels for collaboration

2. **Scalability**:
   - Horizontal scaling of Node.js backend
   - P2P architecture reduces server load
   - Efficient replication protocol for Hypercore data

3. **Resource Usage**:
   - Lazy loading of AI models
   - Configurable cache sizes
   - Batched database operations

## Error Handling

The backend implements structured error handling:

```javascript
// src/utils/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode, code = 'UNKNOWN_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    Error.captureStackTrace(this, this.constructor)
  }
}

// Standard error middleware
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500
  const code = err.code || 'SERVER_ERROR'
  const message = err.message || 'An unexpected error occurred'
  
  if (statusCode === 500) {
    console.error('Server error:', err)
  }
  
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  })
}

module.exports = {
  AppError,
  errorHandler
}
```

## Testing Strategy

The backend testing approach includes:

1. **Unit Tests**:
   - Test individual functions and components
   - Mock external dependencies

2. **Integration Tests**:
   - Test API endpoints with database integration
   - Test P2P networking in a controlled environment

3. **Performance Tests**:
   - Measure response times under load
   - Test WebRTC data channel throughput
   - Benchmark Hypercore replication performance 