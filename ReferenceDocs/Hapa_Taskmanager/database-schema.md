# Database Schema - Hapa Task Manager

## 1. Overview

This document defines the database schema for the Hapa Task Manager application. While the initial implementation will use client-side storage (LocalStorage/IndexedDB), this schema is designed to be compatible with future Hypercore/Hyperbee integration for decentralized storage.

## 2. Data Models

### 2.1 Task

The core entity representing a unit of work within the Hapa ecosystem.

```javascript
{
  id: String,               // UUID v4
  title: String,            // Task title
  description: String,      // Markdown-formatted description
  status: String,           // "pending", "approved", "in-progress", "completed", "rejected"
  createdAt: String,        // ISO 8601 timestamp
  updatedAt: String,        // ISO 8601 timestamp
  creatorDID: String,       // DID of task creator
  assigneeDIDs: [String],   // Array of DIDs for assigned users
  consulId: String,         // UUID of the associated Consul
  votes: [                  // Array of vote objects
    {
      memberDID: String,    // DID of voting member
      vote: String,         // "approve" or "reject"
      timestamp: String,    // ISO 8601 timestamp of vote
      signature: String     // Ed25519 signature for vote verification
    }
  ],
  metadata: {
    priority: String,       // "low", "medium", "high"
    dueDate: String,        // ISO 8601 date
    tags: [String],         // Array of tag strings
    μCreditAllocation: Number // Amount of μCredits for task completion
  },
  flowchartLinks: [String], // Array of UUIDs linking to flowchart nodes
  isDeleted: Boolean,       // Soft delete flag
  version: Number           // Schema version for migration support
}
```

### 2.2 Comment

Comments associated with tasks for discussion and updates.

```javascript
{
  id: String,               // UUID v4
  taskId: String,           // UUID of associated task
  authorDID: String,        // DID of comment author
  content: String,          // Markdown-formatted content
  createdAt: String,        // ISO 8601 timestamp
  updatedAt: String,        // ISO 8601 timestamp
  parentId: String,         // Optional: UUID of parent comment for threading
  mentions: [String],       // Array of DIDs mentioned in comment
  isDeleted: Boolean,       // Soft delete flag
  version: Number           // Schema version for migration support
}
```

### 2.3 User

User information and preferences within the application.

```javascript
{
  did: String,              // Decentralized Identifier
  displayName: String,      // User's display name
  profileImage: String,     // Hash or URI for profile image
  consuls: [String],        // Array of Consul UUIDs user belongs to
  preferences: {
    notifications: Boolean, // Notification preferences
    theme: String,          // "light", "dark", "system"
    defaultView: String,    // "my-tasks", "consul-tasks"
    taskSortOrder: String,  // "newest", "oldest", "priority", "due-date"
    showCompletedTasks: Boolean // Whether to show completed tasks by default
  },
  publicKey: String,        // Ed25519 public key for verification
  lastActive: String,       // ISO 8601 timestamp of last activity
  version: Number           // Schema version for migration support
}
```

### 2.4 Consul

Group of exactly three users who make collective decisions.

```javascript
{
  id: String,               // UUID v4
  name: String,             // Consul name
  description: String,      // Markdown-formatted description
  members: [String],        // Array of exactly 3 DIDs
  createdAt: String,        // ISO 8601 timestamp
  updatedAt: String,        // ISO 8601 timestamp
  feedId: String,           // Hypercore public key (future use)
  metadata: {
    avatar: String,         // Hash or URI for Consul avatar
    tags: [String],         // Descriptive tags for the Consul
    μCreditBalance: Number  // Shared μCredit pool
  },
  isActive: Boolean,        // Whether Consul is currently active
  version: Number           // Schema version for migration support
}
```

### 2.5 Vote

Detailed voting records for task approval and governance.

```javascript
{
  id: String,               // UUID v4
  taskId: String,           // UUID of associated task
  consulId: String,         // UUID of associated Consul
  memberDID: String,        // DID of voting member
  vote: String,             // "approve" or "reject"
  reason: String,           // Optional: explanation for vote
  timestamp: String,        // ISO 8601 timestamp
  signature: String,        // Ed25519 signature
  previousVotes: [          // Optional: history of changed votes
    {
      vote: String,         // Previous vote value
      timestamp: String,    // When the previous vote was cast
      signature: String     // Signature of previous vote
    }
  ],
  version: Number           // Schema version for migration support
}
```

### 2.6 FlowchartLink

Connections between tasks and flowchart nodes.

```javascript
{
  id: String,               // UUID v4
  taskId: String,           // UUID of associated task
  nodeId: String,           // UUID of associated flowchart node
  linkType: String,         // "implements", "blocks", "relates", etc.
  createdAt: String,        // ISO 8601 timestamp
  creatorDID: String,       // DID of link creator
  metadata: {
    description: String,    // Optional description of relationship
    priority: Number        // Relevance/importance of link
  },
  isActive: Boolean,        // Whether link is currently active
  version: Number           // Schema version for migration support
}
```

### 2.7 Activity

Audit trail of changes and actions within the system.

```javascript
{
  id: String,               // UUID v4
  timestamp: String,        // ISO 8601 timestamp
  actorDID: String,         // DID of user performing action
  actionType: String,       // "create", "update", "delete", "vote", "comment", etc.
  entityType: String,       // "task", "comment", "consul", etc.
  entityId: String,         // UUID of affected entity
  details: Object,          // Action-specific details
  version: Number           // Schema version for migration support
}
```

## 3. Relationships

- **Task-Comment**: One-to-many (a task has multiple comments)
- **Task-Vote**: One-to-many (a task has votes from Consul members)
- **User-Consul**: Many-to-many (users can be in multiple Consuls, Consuls have exactly three users)
- **Task-FlowchartLink**: One-to-many (a task can link to multiple flowchart nodes)
- **User-Task**: Many-to-many (users can create and be assigned to multiple tasks)

## 4. Indexes

### 4.1 Local Storage (Phase 1)
- **Tasks**: 
  - By ID (primary)
  - By createdAt (for time-based sorting)
  - By consulId (for filtering by Consul)
  - By creatorDID and assigneeDIDs (for user-specific views)
  - By status (for filtering)

- **Comments**:
  - By ID (primary)
  - By taskId (for retrieving all comments for a task)
  - By parentId (for comment threading)

- **Users**:
  - By DID (primary)

- **Consuls**:
  - By ID (primary)
  - By member DIDs (for finding Consuls a user belongs to)

### 4.2 Hypercore/Hyperbee (Future)
- **Feed Structure**:
  - User feed: Chronological activities by the user
  - Consul feed: Shared tasks and voting records
  - Task feed: Per-task history and comments
  - Reference feed: Links between tasks and flowchart nodes

## 5. Data Validation Rules

- **Task Title**: Required, 3-100 characters
- **Consul Size**: Must contain exactly 3 member DIDs
- **Vote**: Must be "approve" or "reject" only
- **μCredit Allocation**: Must be non-negative integer
- **Priority**: Must be "low", "medium", or "high"
- **Status Transitions**:
  - "pending" → "approved" (requires 2/3 votes)
  - "approved" → "in-progress" → "completed"
  - "pending" → "rejected" (requires 2/3 votes)

## 6. Migration Strategy

### 6.1 Version Tracking
- Each schema includes a version field
- Migration scripts to handle version updates
- Client-side migration for local data during app updates

### 6.2 LocalStorage to Hypercore
- Data export/import functionality
- Batch migration of existing data
- Verification process for data integrity

## 7. Performance Considerations

### 7.1 Data Denormalization
- Task documents include vote information for quick access
- User documents include Consul memberships
- Activity feed for efficient history retrieval

### 7.2 Query Optimization
- Pagination for large result sets
- Filtered indexes for common queries
- Efficient date range queries

## 8. Future Extensions

### 8.1 Rich Metadata
- Custom fields for different task types
- Extended tagging system
- Enhanced priority and categorization options

### 8.2 Attachments
- Document links
- Image attachments
- External resource references

### 8.3 Integration Data
- μCredit transaction records
- Gatekeeper AI interaction history
- Enhanced flowchart linkage metadata 