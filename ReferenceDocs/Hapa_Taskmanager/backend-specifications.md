# Backend Specifications - Hapa Task Manager

## 1. Overview

This document outlines the backend architecture, API design, and data persistence strategies for the Hapa Task Manager. While the initial implementation will be a standalone frontend application, this specification serves as a blueprint for future backend integration following Hapa's decentralized principles.

## 2. Architecture

### 2.1 Core Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js (for future API development)
- **Database**: Initially local storage, transitioning to Hypercore/Hyperbee for decentralized storage

### 2.2 Architectural Principles
- **Decentralized First**: Design for P2P data exchange from the beginning
- **Privacy Focused**: Ensure user data remains under user control
- **Offline Capable**: Core functionality works without constant connectivity
- **Modular Design**: Clear separation of concerns for future extensibility

### 2.3 System Components
- **Local Storage Module**: Manages client-side data persistence
- **Hypercore Feed Manager**: Handles append-only feeds for task data (future)
- **Consul Voting Protocol**: Manages consensus for task approval
- **Authentication System**: DID-based identity management
- **Sync Engine**: Handles peer-to-peer data synchronization

## 3. API Design

### 3.1 API Principles
- **RESTful Design**: Resource-based endpoints with standard HTTP methods
- **JSON Responses**: Consistent response formatting
- **Error Handling**: Detailed error responses with appropriate status codes
- **Pagination**: Support for large result sets
- **Filtering**: Query parameters for narrowing results

### 3.2 Core Endpoints

#### 3.2.1 Task Management
- `GET /tasks` - Retrieve tasks (with filtering options)
- `GET /tasks/:id` - Get specific task details
- `POST /tasks` - Create a new task proposal
- `PUT /tasks/:id` - Update task details
- `DELETE /tasks/:id` - Remove a task (or mark as deleted)

#### 3.2.2 Voting System
- `POST /tasks/:id/votes` - Submit a vote on a task
- `GET /tasks/:id/votes` - Get voting status for a task
- `GET /consul/:id/pending` - Get pending votes for a Consul

#### 3.2.3 Comments
- `GET /tasks/:id/comments` - Get comments for a task
- `POST /tasks/:id/comments` - Add a comment to a task
- `PUT /tasks/:id/comments/:commentId` - Update a comment
- `DELETE /tasks/:id/comments/:commentId` - Remove a comment

#### 3.2.4 User & Authentication
- `POST /auth/did` - Authenticate with DID
- `GET /users/me` - Get current user profile
- `GET /users/:id/tasks` - Get tasks for a specific user

### 3.3 RPC Methods (for P2P Communication)
- `/task.create` - Propagate task creation to peers
- `/task.vote` - Share voting information
- `/feed.append` - Add data to a Hypercore feed
- `/feed.sync` - Synchronize feeds between peers

## 4. Data Models

### 4.1 Task Schema
```javascript
{
  id: "uuid",
  title: "Task title",
  description: "Markdown description",
  status: "pending|approved|in-progress|completed|rejected",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp",
  creatorDID: "did:example:123",
  assigneeDIDs: ["did:example:456"],
  consulId: "consul-uuid",
  votes: [
    {
      memberDID: "did:example:789",
      vote: "approve|reject",
      timestamp: "ISO timestamp",
      signature: "ed25519-signature"
    }
  ],
  metadata: {
    priority: "low|medium|high",
    dueDate: "ISO date",
    tags: ["design", "frontend"],
    μCreditAllocation: 100
  },
  flowchartLinks: ["node-uuid-1", "node-uuid-2"]
}
```

### 4.2 Comment Schema
```javascript
{
  id: "comment-uuid",
  taskId: "task-uuid",
  authorDID: "did:example:123",
  content: "Markdown content",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp",
  parentId: "parent-comment-id", // for threading
  mentions: ["did:example:456"]
}
```

### 4.3 User Schema
```javascript
{
  did: "did:example:123",
  displayName: "User Name",
  profileImage: "image-hash",
  consuls: ["consul-uuid-1", "consul-uuid-2"],
  preferences: {
    notifications: true,
    theme: "light|dark",
    defaultView: "my-tasks|consul-tasks"
  }
}
```

### 4.4 Consul Schema
```javascript
{
  id: "consul-uuid",
  name: "Consul Name",
  members: ["did:example:123", "did:example:456", "did:example:789"],
  createdAt: "ISO timestamp",
  feedId: "hypercore-public-key"
}
```

## 5. Data Persistence

### 5.1 Initial Storage Strategy
- LocalStorage/IndexedDB for client-side data persistence
- JSON-based data structure mirroring future Hypercore schema
- Optimistic UI updates with local-first data approach

### 5.2 Decentralized Storage (Future)
- **Hypercore**: Append-only feeds for each user's task data
- **Hyperbee**: Key-value store built on Hypercore for efficient lookups
- **Feed Structure**:
  - User feed: Personal task data, votes, comments
  - Consul feed: Shared task data, consensus records
  - Reference feed: Links between tasks and flowchart nodes

### 5.3 Sync Mechanism
- **WebRTC** for direct peer-to-peer connections
- **Hyperswarm** for peer discovery (future)
- **Conflict Resolution**: Last-write-wins with timestamp verification
- **Partial Replication**: Selective sync based on user preferences

## 6. Security Considerations

### 6.1 Authentication & Authorization
- **DID Authentication**: Decentralized identity for user verification
- **Ed25519 Signatures**: Cryptographic signatures for votes and important actions
- **Key Management**: Secure storage of cryptographic keys

### 6.2 Data Protection
- **End-to-End Encryption**: AES-256-GCM for sensitive data
- **Zero-Knowledge Proofs**: For privacy-preserving verification (future)
- **Data Minimization**: Only store necessary information

### 6.3 Audit Trail
- Immutable history of task changes
- Cryptographic proof of vote integrity
- Verifiable consensus process

## 7. Integration Points

### 7.1 Hypercore Protocol
- Feed management and replication
- Distributed identity verification
- Peer discovery and connection

### 7.2 Gatekeeper AI
- Task prioritization and filtering
- Automation of routine task management
- Spam detection and prevention

### 7.3 μCredit System
- Task valuation and reward distribution
- Credit minting upon task completion
- Incentive mechanisms for participation

### 7.4 Flowchart Application
- Bidirectional linking between tasks and flowchart nodes
- Schema alignment for seamless data exchange
- Consistent permissions and access control

## 8. Implementation Phases

### 8.1 Phase 1: Standalone Frontend
- Local storage implementation
- Simulated Consul voting
- Offline-first architecture

### 8.2 Phase 2: Basic P2P Connectivity
- WebRTC integration for direct connections
- Basic Hypercore feed management
- DID authentication implementation

### 8.3 Phase 3: Full Decentralization
- Complete Hypercore/Hyperbee storage
- Comprehensive P2P sync with conflict resolution
- Integration with Hapa ecosystem 