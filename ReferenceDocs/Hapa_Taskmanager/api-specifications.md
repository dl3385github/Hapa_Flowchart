# API Specifications - Hapa Task Manager

## 1. Overview

This document outlines the API specifications for the Hapa Task Manager application. The API is designed to support both traditional REST endpoints (for immediate implementation) and RPC methods (for future P2P communication). These specifications align with Hapa's decentralized philosophy while providing a clear path for initial development.

## 2. General API Guidelines

### 2.1 Request/Response Format
- All API endpoints accept and return JSON data
- Use camelCase for property names
- ISO 8601 format for all dates and timestamps
- UTF-8 encoding for all text

### 2.2 Authentication
- DID-based authentication
- JWT tokens for session management
- Ed25519 signatures for critical operations

### 2.3 Error Handling
- HTTP status codes for REST endpoints
- Detailed error messages in response body
- Error response format:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable error message",
      "details": { /* Additional error details */ }
    }
  }
  ```

### 2.4 Versioning
- API version included in URL path: `/api/v1/`
- Future versions will maintain backward compatibility when possible

## 3. REST API Endpoints

### 3.1 Tasks

#### GET /api/v1/tasks
Retrieve a list of tasks with filtering options.

**Query Parameters:**
- `status` - Filter by task status
- `consulId` - Filter by Consul ID
- `assigneeDid` - Filter by assignee
- `creatorDid` - Filter by creator
- `sortBy` - Sort field (createdAt, updatedAt, dueDate, priority)
- `sortOrder` - Sort direction (asc, desc)
- `limit` - Maximum number of results
- `offset` - Pagination offset

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "title": "Task title",
      "status": "pending",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "creatorDID": "did:example:123",
      "assigneeDIDs": ["did:example:456"],
      "consulId": "consul-uuid",
      "metadata": {
        "priority": "high",
        "dueDate": "2025-02-01",
        "tags": ["design"]
      },
      "voteCount": {
        "approve": 1,
        "reject": 0,
        "pending": 2
      }
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### GET /api/v1/tasks/:id
Retrieve detailed information about a specific task.

**Path Parameters:**
- `id` - Task UUID

**Response:**
```json
{
  "id": "task-uuid",
  "title": "Task title",
  "description": "Markdown description of the task",
  "status": "approved",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "creatorDID": "did:example:123",
  "assigneeDIDs": ["did:example:456"],
  "consulId": "consul-uuid",
  "votes": [
    {
      "memberDID": "did:example:789",
      "vote": "approve",
      "timestamp": "2025-01-01T01:00:00Z",
      "signature": "ed25519-signature"
    }
  ],
  "metadata": {
    "priority": "high",
    "dueDate": "2025-02-01",
    "tags": ["design", "frontend"],
    "μCreditAllocation": 100
  },
  "flowchartLinks": ["node-uuid-1"]
}
```

#### POST /api/v1/tasks
Create a new task proposal.

**Request Body:**
```json
{
  "title": "Implement task list view",
  "description": "Create a responsive task list with filtering options",
  "consulId": "consul-uuid",
  "assigneeDIDs": ["did:example:456"],
  "metadata": {
    "priority": "high",
    "dueDate": "2025-02-01",
    "tags": ["frontend", "ui"]
  }
}
```

**Response:**
```json
{
  "id": "new-task-uuid",
  "title": "Implement task list view",
  "status": "pending",
  "createdAt": "2025-01-01T00:00:00Z",
  "creatorDID": "did:example:123"
}
```

#### PUT /api/v1/tasks/:id
Update an existing task.

**Path Parameters:**
- `id` - Task UUID

**Request Body:**
```json
{
  "title": "Updated task title",
  "description": "Updated task description",
  "metadata": {
    "priority": "medium",
    "dueDate": "2025-02-15"
  }
}
```

**Response:**
```json
{
  "id": "task-uuid",
  "title": "Updated task title",
  "updatedAt": "2025-01-02T00:00:00Z"
}
```

#### DELETE /api/v1/tasks/:id
Mark a task as deleted (soft delete).

**Path Parameters:**
- `id` - Task UUID

**Response:**
```json
{
  "success": true,
  "message": "Task successfully deleted"
}
```

### 3.2 Voting

#### POST /api/v1/tasks/:id/votes
Submit a vote on a task.

**Path Parameters:**
- `id` - Task UUID

**Request Body:**
```json
{
  "vote": "approve",
  "reason": "This task aligns with our sprint goals"
}
```

**Response:**
```json
{
  "taskId": "task-uuid",
  "memberDID": "did:example:123",
  "vote": "approve",
  "timestamp": "2025-01-01T00:00:00Z",
  "voteStatus": {
    "approve": 2,
    "reject": 0,
    "pending": 1
  },
  "taskStatus": "pending"
}
```

#### GET /api/v1/tasks/:id/votes
Get voting status for a task.

**Path Parameters:**
- `id` - Task UUID

**Response:**
```json
{
  "taskId": "task-uuid",
  "votes": [
    {
      "memberDID": "did:example:123",
      "vote": "approve",
      "timestamp": "2025-01-01T00:00:00Z",
      "reason": "This task aligns with our sprint goals"
    },
    {
      "memberDID": "did:example:456",
      "vote": "approve",
      "timestamp": "2025-01-01T01:00:00Z"
    },
    {
      "memberDID": "did:example:789",
      "vote": null,
      "timestamp": null
    }
  ],
  "summary": {
    "approve": 2,
    "reject": 0,
    "pending": 1
  },
  "status": "pending",
  "requiredForApproval": 2,
  "requiredForRejection": 2
}
```

#### GET /api/v1/users/me/pending-votes
Get tasks requiring the current user's vote.

**Response:**
```json
{
  "pendingVotes": [
    {
      "taskId": "task-uuid-1",
      "title": "Implement user profile",
      "createdAt": "2025-01-01T00:00:00Z",
      "creatorDID": "did:example:456",
      "consulId": "consul-uuid"
    },
    {
      "taskId": "task-uuid-2",
      "title": "Fix navigation bug",
      "createdAt": "2025-01-02T00:00:00Z",
      "creatorDID": "did:example:789",
      "consulId": "consul-uuid"
    }
  ],
  "count": 2
}
```

### 3.3 Comments

#### GET /api/v1/tasks/:id/comments
Get comments for a task.

**Path Parameters:**
- `id` - Task UUID

**Query Parameters:**
- `limit` - Maximum number of results
- `offset` - Pagination offset

**Response:**
```json
{
  "comments": [
    {
      "id": "comment-uuid-1",
      "taskId": "task-uuid",
      "authorDID": "did:example:123",
      "authorName": "Alice",
      "content": "I've started working on this",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "parentId": null,
      "mentions": []
    },
    {
      "id": "comment-uuid-2",
      "taskId": "task-uuid",
      "authorDID": "did:example:456",
      "authorName": "Bob",
      "content": "Let me know if you need help @Alice",
      "createdAt": "2025-01-01T01:00:00Z",
      "updatedAt": "2025-01-01T01:00:00Z",
      "parentId": "comment-uuid-1",
      "mentions": ["did:example:123"]
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

#### POST /api/v1/tasks/:id/comments
Add a comment to a task.

**Path Parameters:**
- `id` - Task UUID

**Request Body:**
```json
{
  "content": "I've completed the first part of this task",
  "parentId": "comment-uuid-1",
  "mentions": ["did:example:456"]
}
```

**Response:**
```json
{
  "id": "new-comment-uuid",
  "taskId": "task-uuid",
  "authorDID": "did:example:123",
  "authorName": "Alice",
  "content": "I've completed the first part of this task",
  "createdAt": "2025-01-02T00:00:00Z",
  "updatedAt": "2025-01-02T00:00:00Z",
  "parentId": "comment-uuid-1",
  "mentions": ["did:example:456"]
}
```

#### PUT /api/v1/tasks/:taskId/comments/:commentId
Update a comment.

**Path Parameters:**
- `taskId` - Task UUID
- `commentId` - Comment UUID

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

**Response:**
```json
{
  "id": "comment-uuid",
  "content": "Updated comment content",
  "updatedAt": "2025-01-02T01:00:00Z"
}
```

#### DELETE /api/v1/tasks/:taskId/comments/:commentId
Delete a comment (soft delete).

**Path Parameters:**
- `taskId` - Task UUID
- `commentId` - Comment UUID

**Response:**
```json
{
  "success": true,
  "message": "Comment successfully deleted"
}
```

### 3.4 Users and Authentication

#### POST /api/v1/auth/did
Authenticate with DID.

**Request Body:**
```json
{
  "did": "did:example:123",
  "signature": "signed-challenge",
  "challenge": "auth-challenge-string"
}
```

**Response:**
```json
{
  "token": "jwt-auth-token",
  "user": {
    "did": "did:example:123",
    "displayName": "Alice",
    "consuls": ["consul-uuid-1", "consul-uuid-2"]
  },
  "expiresAt": "2025-01-02T00:00:00Z"
}
```

#### GET /api/v1/users/me
Get current user profile.

**Response:**
```json
{
  "did": "did:example:123",
  "displayName": "Alice",
  "profileImage": "image-hash",
  "consuls": [
    {
      "id": "consul-uuid-1",
      "name": "Product Team",
      "members": [
        "did:example:123",
        "did:example:456",
        "did:example:789"
      ]
    }
  ],
  "preferences": {
    "notifications": true,
    "theme": "dark",
    "defaultView": "my-tasks"
  },
  "stats": {
    "tasksCreated": 15,
    "tasksCompleted": 12,
    "pendingVotes": 3,
    "μCreditBalance": 520
  }
}
```

#### PUT /api/v1/users/me
Update user profile or preferences.

**Request Body:**
```json
{
  "displayName": "Alice Smith",
  "preferences": {
    "theme": "light",
    "defaultView": "consul-tasks"
  }
}
```

**Response:**
```json
{
  "did": "did:example:123",
  "displayName": "Alice Smith",
  "preferences": {
    "theme": "light",
    "defaultView": "consul-tasks"
  },
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### 3.5 Consuls

#### GET /api/v1/consuls
Get consuls the current user belongs to.

**Response:**
```json
{
  "consuls": [
    {
      "id": "consul-uuid-1",
      "name": "Product Team",
      "description": "Main product development team",
      "members": [
        {
          "did": "did:example:123",
          "displayName": "Alice"
        },
        {
          "did": "did:example:456",
          "displayName": "Bob"
        },
        {
          "did": "did:example:789",
          "displayName": "Charlie"
        }
      ],
      "createdAt": "2024-12-01T00:00:00Z",
      "metadata": {
        "avatar": "avatar-hash",
        "tags": ["product", "development"]
      }
    }
  ]
}
```

#### GET /api/v1/consuls/:id
Get detailed information about a specific consul.

**Path Parameters:**
- `id` - Consul UUID

**Response:**
```json
{
  "id": "consul-uuid",
  "name": "Product Team",
  "description": "Main product development team",
  "members": [
    {
      "did": "did:example:123",
      "displayName": "Alice",
      "profileImage": "image-hash-1"
    },
    {
      "did": "did:example:456",
      "displayName": "Bob",
      "profileImage": "image-hash-2"
    },
    {
      "did": "did:example:789",
      "displayName": "Charlie",
      "profileImage": "image-hash-3"
    }
  ],
  "createdAt": "2024-12-01T00:00:00Z",
  "updatedAt": "2024-12-15T00:00:00Z",
  "metadata": {
    "avatar": "avatar-hash",
    "tags": ["product", "development"],
    "μCreditBalance": 1500
  },
  "stats": {
    "tasksCreated": 45,
    "tasksCompleted": 38,
    "tasksInProgress": 7
  }
}
```

#### POST /api/v1/consuls
Create a new consul.

**Request Body:**
```json
{
  "name": "Design Team",
  "description": "UI/UX design team",
  "members": ["did:example:123", "did:example:456", "did:example:789"],
  "metadata": {
    "tags": ["design", "ui"]
  }
}
```

**Response:**
```json
{
  "id": "new-consul-uuid",
  "name": "Design Team",
  "members": ["did:example:123", "did:example:456", "did:example:789"],
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### 3.6 Flowchart Integration

#### GET /api/v1/tasks/:id/flowchart-links
Get flowchart nodes linked to a task.

**Path Parameters:**
- `id` - Task UUID

**Response:**
```json
{
  "links": [
    {
      "id": "link-uuid-1",
      "taskId": "task-uuid",
      "nodeId": "node-uuid-1",
      "linkType": "implements",
      "createdAt": "2025-01-01T00:00:00Z",
      "creatorDID": "did:example:123",
      "metadata": {
        "description": "Task implements this flowchart node",
        "priority": 1
      }
    }
  ]
}
```

#### POST /api/v1/tasks/:id/flowchart-links
Create a link between task and flowchart node.

**Path Parameters:**
- `id` - Task UUID

**Request Body:**
```json
{
  "nodeId": "node-uuid-1",
  "linkType": "implements",
  "metadata": {
    "description": "Task implements this flowchart node"
  }
}
```

**Response:**
```json
{
  "id": "new-link-uuid",
  "taskId": "task-uuid",
  "nodeId": "node-uuid-1",
  "linkType": "implements",
  "createdAt": "2025-01-01T00:00:00Z",
  "creatorDID": "did:example:123"
}
```

#### DELETE /api/v1/tasks/:taskId/flowchart-links/:linkId
Remove a link between task and flowchart node.

**Path Parameters:**
- `taskId` - Task UUID
- `linkId` - Link UUID

**Response:**
```json
{
  "success": true,
  "message": "Link successfully removed"
}
```

## 4. RPC Methods (for P2P Communication)

### 4.1 Task Management

#### task.create
Create a new task and propagate to peers.

**Parameters:**
```json
{
  "title": "Task title",
  "description": "Task description",
  "consulId": "consul-uuid",
  "assigneeDIDs": ["did:example:456"],
  "metadata": {
    "priority": "high",
    "dueDate": "2025-02-01",
    "tags": ["frontend"]
  },
  "signature": "ed25519-signature"
}
```

**Result:**
```json
{
  "id": "task-uuid",
  "status": "pending",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### task.vote
Submit a vote on a task.

**Parameters:**
```json
{
  "taskId": "task-uuid",
  "vote": "approve",
  "reason": "Aligns with our goals",
  "signature": "ed25519-signature",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

**Result:**
```json
{
  "taskId": "task-uuid",
  "voteStatus": {
    "approve": 2,
    "reject": 0,
    "pending": 1
  }
}
```

#### task.update
Update task status or details.

**Parameters:**
```json
{
  "taskId": "task-uuid",
  "status": "in-progress",
  "updates": {
    "description": "Updated description",
    "metadata": {
      "priority": "medium"
    }
  },
  "signature": "ed25519-signature",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

**Result:**
```json
{
  "taskId": "task-uuid",
  "status": "in-progress",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### 4.2 Feed Management

#### feed.append
Add data to a Hypercore feed.

**Parameters:**
```json
{
  "feedId": "hypercore-public-key",
  "data": {
    "type": "task-creation",
    "content": {
      "taskId": "task-uuid",
      "title": "Task title",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  },
  "signature": "ed25519-signature"
}
```

**Result:**
```json
{
  "feedId": "hypercore-public-key",
  "sequenceNumber": 42,
  "contentHash": "content-hash"
}
```

#### feed.sync
Synchronize feeds between peers.

**Parameters:**
```json
{
  "feedId": "hypercore-public-key",
  "from": 36,
  "to": 42,
  "signature": "ed25519-signature"
}
```

**Result:**
```json
{
  "feedId": "hypercore-public-key",
  "synced": true,
  "latestSequenceNumber": 42
}
```

### 4.3 User Discovery

#### user.announce
Announce user presence to the network.

**Parameters:**
```json
{
  "did": "did:example:123",
  "displayName": "Alice",
  "consuls": ["consul-uuid-1", "consul-uuid-2"],
  "signature": "ed25519-signature",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

**Result:**
```json
{
  "acknowledged": true,
  "peers": 3
}
```

#### user.lookup
Look up a user by DID.

**Parameters:**
```json
{
  "did": "did:example:123"
}
```

**Result:**
```json
{
  "did": "did:example:123",
  "displayName": "Alice",
  "consuls": ["consul-uuid-1", "consul-uuid-2"],
  "lastSeen": "2025-01-01T00:00:00Z"
}
```

## 5. WebSocket Events

### 5.1 Task Events

- `task:created` - New task created
- `task:updated` - Task details updated
- `task:status_changed` - Task status changed
- `task:vote` - New vote on task
- `task:approved` - Task approved by Consul
- `task:rejected` - Task rejected by Consul
- `task:comment` - New comment on task

### 5.2 User Events

- `user:online` - User came online
- `user:offline` - User went offline
- `user:joined_consul` - User joined a Consul
- `user:left_consul` - User left a Consul

### 5.3 System Events

- `system:sync_started` - Feed synchronization started
- `system:sync_completed` - Feed synchronization completed
- `system:error` - System error occurred

## 6. Implementation Phases

### 6.1 Phase 1: Local-Only API
- Implement core REST endpoints
- Use browser localStorage/IndexedDB for persistence
- Mock authentication flow

### 6.2 Phase 2: Server-backed API
- Implement full REST API with server persistence
- Add real authentication
- Implement WebSocket events

### 6.3 Phase 3: P2P Communication
- Implement RPC methods
- Add Hypercore feed management
- Enable direct peer-to-peer data exchange 