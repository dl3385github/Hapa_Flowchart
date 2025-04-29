# Database Schema - Hapa Flowchart

## Overview

The Hapa Flowchart application uses a multi-layered storage approach combining Hypercore/Hyperbee for distributed, versioned storage and IndexedDB for client-side caching and offline capabilities. This document outlines the schema design for both storage layers and their interactions.

## Hypercore/Hyperbee Schema

Hypercore provides an append-only log structure that serves as the foundation for our distributed data storage. Hyperbee builds on top of Hypercore to provide a key-value database with versioning capabilities.

### Flowchart Feed

Each flowchart is stored in its own Hypercore feed with a unique key pair. This allows for fine-grained access control and selective replication.

```
Flowchart Feed (Hypercore)
└── Hyperbee Database
    ├── metadata
    ├── nodes
    ├── edges
    ├── versions
    ├── permissions
    ├── linkedTasks
    └── comments
```

### Key Structures

#### Metadata

Stores basic information about the flowchart.

**Key**: `metadata`

**Value**:
```javascript
{
  id: String,                // Unique identifier
  name: String,              // Flowchart title
  description: String,       // Optional description
  createdAt: Date,           // ISO timestamp
  updatedAt: Date,           // ISO timestamp
  createdBy: String,         // DID of creator
  version: Number,           // Current version
  public: Boolean,           // Visibility setting
  tags: [String],            // Searchable tags
  consulId: String,          // Associated Consul ID (if any)
  cryptoMetadata: {          // Crypto-economic data
    rewards: Number,         // μCredits earned
    staked: Number           // Bananas staked
  }
}
```

#### Nodes

Stores the nodes (elements) of the flowchart. Each node is stored as a separate key-value pair for efficient updates.

**Key**: `nodes/${nodeId}`

**Value**:
```javascript
{
  id: String,                // Unique node identifier
  type: String,              // Node type (e.g., "task", "decision", "process")
  position: {                // Position on canvas
    x: Number,
    y: Number
  },
  data: {                    // Node-specific data
    label: String,           // Display text
    taskId: String,          // Reference to Task Manager task (optional)
    description: String,     // Detailed description
    properties: {            // Additional properties based on node type
      [key: String]: any
    }
  },
  style: {                   // Visual styling
    width: Number,
    height: Number,
    backgroundColor: String,
    borderColor: String,
    borderWidth: Number,
    borderRadius: Number,
    fontSize: Number,
    padding: Number,
    // Additional styling properties
  },
  parentId: String,          // Parent node ID (for grouped nodes)
  createdAt: Date,           // When the node was created
  updatedAt: Date,           // When the node was last updated
  createdBy: String,         // DID of creator
  updatedBy: String          // DID of last editor
}
```

#### Edges

Stores the connections between nodes. Each edge is stored as a separate key-value pair.

**Key**: `edges/${edgeId}`

**Value**:
```javascript
{
  id: String,                // Unique edge identifier
  source: String,            // ID of source node
  target: String,            // ID of target node
  sourceHandle: String,      // Optional source connection point
  targetHandle: String,      // Optional target connection point
  type: String,              // Edge type (e.g., "default", "step", "conditional")
  animated: Boolean,         // Whether the edge has animation
  label: String,             // Optional label text
  data: {                    // Edge-specific data
    condition: String,       // Condition text for conditional edges
    probability: Number,     // Probability value (0-100)
    properties: {            // Additional properties
      [key: String]: any
    }
  },
  style: {                   // Visual styling
    strokeWidth: Number,
    stroke: String,          // Color
    strokeDasharray: String, // For dashed lines
    labelBackgroundColor: String,
    labelColor: String,
    fontSize: Number,
    // Additional styling properties
  },
  createdAt: Date,           // When the edge was created
  updatedAt: Date,           // When the edge was last updated
  createdBy: String,         // DID of creator
  updatedBy: String          // DID of last editor
}
```

#### Versions

Stores version history for the flowchart. Each version entry contains a complete snapshot or delta changes.

**Key**: `versions/${versionNumber}`

**Value**:
```javascript
{
  version: Number,           // Sequential version number
  timestamp: Date,           // When this version was created
  author: String,            // DID of user who made the change
  message: String,           // Optional commit message
  changes: {                 // Summary of changes
    nodesAdded: [String],    // IDs of added nodes
    nodesRemoved: [String],  // IDs of removed nodes
    nodesModified: [String], // IDs of modified nodes
    edgesAdded: [String],    // IDs of added edges
    edgesRemoved: [String],  // IDs of removed edges
    edgesModified: [String], // IDs of modified edges
  },
  delta: {                   // Detailed changes (optional)
    nodes: {                 // Node changes
      [nodeId]: {
        before: Object,      // Node state before change
        after: Object        // Node state after change
      }
    },
    edges: {                 // Edge changes
      [edgeId]: {
        before: Object,      // Edge state before change
        after: Object        // Edge state after change
      }
    }
  },
  snapshot: String,          // Reference to snapshot (if stored separately)
  signature: String          // Ed25519 signature of the version data
}
```

#### Permissions

Stores access control information for the flowchart.

**Key**: `permissions/${did}`

**Value**:
```javascript
{
  did: String,               // DID of user
  role: String,              // "owner", "editor", "viewer"
  grantedAt: Date,           // When permission was granted
  grantedBy: String,         // DID of user who granted permission
  consulVote: {              // If permission requires Consul vote
    required: Number,        // Votes required
    received: Number,        // Votes received
    approved: Boolean        // Whether approved
  },
  expiresAt: Date            // Optional expiration date
}
```

#### Linked Tasks

Stores connections between flowchart nodes and Hapa Task Manager tasks.

**Key**: `linkedTasks/${taskId}`

**Value**:
```javascript
{
  taskId: String,            // Task ID in Hapa Task Manager
  nodeId: String,            // Node ID in the flowchart
  linkedAt: Date,            // When the link was created
  linkedBy: String,          // DID of user who created the link
  metadata: {                // Additional link metadata
    bidirectional: Boolean,  // Whether the link is bidirectional
    notes: String            // Optional notes about the link
  }
}
```

#### Comments

Stores comments and annotations on the flowchart.

**Key**: `comments/${commentId}`

**Value**:
```javascript
{
  id: String,                // Unique comment identifier
  text: String,              // Comment text
  position: {                // Position on canvas
    x: Number,
    y: Number
  },
  attachedTo: {              // What the comment is attached to
    type: String,            // "node", "edge", or "canvas"
    id: String               // ID of node or edge (if applicable)
  },
  createdAt: Date,           // When the comment was created
  createdBy: String,         // DID of creator
  updatedAt: Date,           // When the comment was last updated
  updatedBy: String,         // DID of last editor
  resolved: Boolean          // Whether the comment is resolved
}
```

## IndexedDB Schema

IndexedDB is used for client-side storage to enable offline functionality and improve performance. The database structure mirrors the Hypercore/Hyperbee schema but is optimized for local access patterns.

### Database Structure

```
HapaFlowchartDB
├── flowcharts (store)
├── nodes (store)
├── edges (store)
├── versions (store)
├── tasks (store)
├── comments (store)
└── syncState (store)
```

### Object Stores

#### flowcharts

Stores metadata for all flowcharts the user has access to.

**Key Path**: `id`

**Indexes**:
- `name` (for search)
- `updatedAt` (for sorting)
- `hypercoreKey` (for P2P syncing)

**Sample Object**:
```javascript
{
  id: "flow_abc123",
  name: "Project Roadmap",
  description: "Development roadmap for Q3",
  createdAt: "2023-06-15T14:32:10Z",
  updatedAt: "2023-06-16T09:15:22Z",
  version: 12,
  hypercoreKey: "8e45a7f...",
  public: true,
  createdBy: "did:hapa:user1",
  consulId: "consul_xyz789",
  tags: ["project", "development", "roadmap"],
  cryptoMetadata: {
    rewards: 50,
    staked: 10
  }
}
```

#### nodes

Stores all nodes from all flowcharts. Uses compound key to optimize queries.

**Key Path**: `[flowchartId, id]`

**Indexes**:
- `flowchartId` (for filtering by flowchart)
- `type` (for filtering by node type)
- `taskId` (for finding nodes linked to tasks)

**Sample Object**:
```javascript
{
  id: "node_1",
  flowchartId: "flow_abc123",
  type: "task",
  position: {
    x: 100,
    y: 200
  },
  data: {
    label: "Research Phase",
    taskId: "task_123",
    description: "Conduct market research and competitive analysis",
    properties: {
      duration: "2 weeks",
      resources: ["Alice", "Bob"]
    }
  },
  style: {
    width: 200,
    height: 80,
    backgroundColor: "#f0f9ff",
    borderColor: "#3b82f6",
    borderWidth: 2,
    borderRadius: 8,
    fontSize: 14,
    padding: 16
  },
  parentId: null,
  createdAt: "2023-06-15T14:35:10Z",
  updatedAt: "2023-06-15T14:35:10Z",
  createdBy: "did:hapa:user1",
  updatedBy: "did:hapa:user1"
}
```

#### edges

Stores all edges from all flowcharts. Uses compound key to optimize queries.

**Key Path**: `[flowchartId, id]`

**Indexes**:
- `flowchartId` (for filtering by flowchart)
- `source` (for finding outgoing edges)
- `target` (for finding incoming edges)

**Sample Object**:
```javascript
{
  id: "edge_1",
  flowchartId: "flow_abc123",
  source: "node_1",
  target: "node_2",
  sourceHandle: "bottom",
  targetHandle: "top",
  type: "default",
  animated: false,
  label: "Next Step",
  data: {
    condition: "",
    probability: 100,
    properties: {}
  },
  style: {
    strokeWidth: 2,
    stroke: "#3b82f6",
    strokeDasharray: "",
    labelBackgroundColor: "#ffffff",
    labelColor: "#374151",
    fontSize: 12
  },
  createdAt: "2023-06-15T14:36:22Z",
  updatedAt: "2023-06-15T14:36:22Z",
  createdBy: "did:hapa:user1",
  updatedBy: "did:hapa:user1"
}
```

#### versions

Stores version history information.

**Key Path**: `[flowchartId, version]`

**Indexes**:
- `flowchartId` (for filtering by flowchart)
- `timestamp` (for chronological sorting)
- `author` (for filtering by author)

**Sample Object**:
```javascript
{
  flowchartId: "flow_abc123",
  version: 12,
  timestamp: "2023-06-16T09:15:22Z",
  author: "did:hapa:user1",
  message: "Added decision node for product pricing",
  changes: {
    nodesAdded: ["node_5"],
    nodesRemoved: [],
    nodesModified: ["node_2"],
    edgesAdded: ["edge_6"],
    edgesRemoved: [],
    edgesModified: []
  },
  signature: "ed25519signature..."
}
```

#### tasks

Caches task data from the Hapa Task Manager.

**Key Path**: `id`

**Indexes**:
- `status` (for filtering by status)
- `deadline` (for sorting by deadline)
- `assignedTo` (for filtering by assignment)

**Sample Object**:
```javascript
{
  id: "task_123",
  title: "Complete research phase",
  description: "Gather market data and competitor analysis",
  status: "in-progress",
  createdAt: "2023-06-10T08:15:30Z",
  updatedAt: "2023-06-15T16:42:18Z",
  deadline: "2023-07-30T00:00:00Z",
  priority: 3,
  assignedTo: ["did:hapa:user1", "did:hapa:user2"],
  creator: "did:hapa:admin1",
  consulVotes: {
    required: 2,
    received: 1,
    approved: false
  },
  rewards: {
    µCredits: 50,
    distribution: {
      contributors: 70,
      auditors: 20,
      builder: 10
    }
  },
  linkedFlowcharts: ["flow_abc123"],
  lastSynced: "2023-06-18T10:25:45Z"  // When task data was last fetched
}
```

#### comments

Stores comments and annotations.

**Key Path**: `[flowchartId, id]`

**Indexes**:
- `flowchartId` (for filtering by flowchart)
- `attachedTo.id` (for finding comments attached to a specific node/edge)
- `createdBy` (for filtering by author)
- `resolved` (for filtering by resolution status)

**Sample Object**:
```javascript
{
  id: "comment_1",
  flowchartId: "flow_abc123",
  text: "Consider adding a decision point here",
  position: {
    x: 150,
    y: 250
  },
  attachedTo: {
    type: "node",
    id: "node_1"
  },
  createdAt: "2023-06-16T13:45:22Z",
  createdBy: "did:hapa:user2",
  updatedAt: "2023-06-16T13:45:22Z",
  updatedBy: "did:hapa:user2",
  resolved: false
}
```

#### syncState

Tracks synchronization state for offline changes.

**Key Path**: `[flowchartId, type]`

**Indexes**:
- `flowchartId` (for filtering by flowchart)
- `lastSynced` (for tracking sync time)

**Sample Object**:
```javascript
{
  flowchartId: "flow_abc123",
  type: "nodes",
  lastSynced: "2023-06-18T14:25:10Z",
  pendingChanges: [
    {
      id: "node_6",
      operation: "update",
      data: {
        // Node data
      },
      timestamp: "2023-06-18T14:24:55Z"
    }
  ],
  conflictResolution: "lastWriteWins"  // Conflict resolution strategy
}
```

## Database Interactions

### Data Flow

1. **Read Operations**:
   - Check IndexedDB first for cached data
   - If not found or stale, fetch from Hypercore
   - Update IndexedDB cache with fetched data

2. **Write Operations**:
   - Write to IndexedDB immediately (optimistic updates)
   - Queue write to Hypercore
   - Update version history in both stores when confirmed
   - Handle conflicts if they arise

3. **Sync Operations**:
   - Pull changes from connected peers via Hypercore replication
   - Apply changes to IndexedDB
   - Push local changes to connected peers

### Relationship with Hapa Task Manager

The Hapa Flowchart application maintains references to tasks in the Hapa Task Manager but does not store complete task data. Instead, it:

1. Caches basic task information for display purposes
2. Stores links between tasks and flowchart nodes
3. Refreshes task data periodically or on user request
4. Maintains bidirectional references when possible

## Security Considerations

1. **Encryption**:
   - All data in Hypercore is encrypted using AES-256-GCM
   - Encryption keys are derived from the Hypercore secret key
   - IndexedDB data is encrypted at rest using the Web Crypto API

2. **Access Control**:
   - Permission checks are performed at the application level
   - Hypercore feeds are only shared with authorized peers
   - IndexedDB access is limited to the origin domain

3. **Data Integrity**:
   - All Hypercore entries are signed with Ed25519 signatures
   - Version history maintains an audit trail of all changes
   - Conflict resolution strategies preserve user intent

## Backup and Recovery

1. **Local Backup**:
   - Periodic export of flowchart data to local files
   - Export formats include JSON and SVG

2. **P2P Replication**:
   - Automatic replication across authorized peers
   - Multi-device sync for resilience

3. **Recovery**:
   - Version history allows point-in-time recovery
   - Conflict resolution for simultaneous edits
   - Automatic recovery from network interruptions

## Performance Optimizations

1. **Indexing Strategy**:
   - Optimized indexes for common query patterns
   - Compound indexes for related data

2. **Caching**:
   - Aggressive caching of flowchart data in IndexedDB
   - In-memory caching of active flowchart elements

3. **Lazy Loading**:
   - Load only visible portions of large flowcharts
   - Background loading of related data 