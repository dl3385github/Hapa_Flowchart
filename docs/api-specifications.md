# API Specifications - Hapa Flowchart

## Overview

The Hapa Flowchart API provides endpoints for managing flowcharts, collaborating with other users, and integrating with the Hapa Task Manager. The API is built with Node.js and follows RESTful design principles with WebSocket support for real-time updates.

## Base URL

```
http://localhost:3000/api/v1
```

When deployed:

```
https://flowchart.hapanetwork.org/api/v1
```

## Authentication

Most API endpoints don't require authentication since the app uses a local-first approach with P2P synchronization. However, integration with Hapa Task Manager requires authentication via DID (Decentralized Identifier).

Authentication headers:

```
Authorization: Bearer <did-jwt-token>
```

## API Endpoints

### Flowchart Management

#### List Flowcharts

Retrieves all flowcharts available to the user.

```
GET /flowcharts
```

**Response:**

```json
{
  "success": true,
  "data": {
    "flowcharts": [
      {
        "id": "flow_abc123",
        "name": "Project Roadmap",
        "description": "Development roadmap for Q3",
        "createdAt": "2023-06-15T14:32:10Z",
        "updatedAt": "2023-06-16T09:15:22Z",
        "hypercoreKey": "8e45a7f...",
        "taskCount": 5
      },
      // Additional flowcharts...
    ]
  }
}
```

#### Create Flowchart

Creates a new flowchart.

```
POST /flowcharts
```

**Request Body:**

```json
{
  "name": "Marketing Campaign Flow",
  "description": "Flowchart for Q4 marketing campaign",
  "initialData": {
    "nodes": [],
    "edges": []
  },
  "taskId": "task_xyz789"  // Optional, links to a Hapa Task Manager task
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "flow_def456",
    "name": "Marketing Campaign Flow",
    "hypercoreKey": "9f56b8g...",
    "createdAt": "2023-07-20T11:45:30Z"
  }
}
```

#### Get Flowchart

Retrieves a specific flowchart by ID.

```
GET /flowcharts/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "flow_abc123",
    "name": "Project Roadmap",
    "description": "Development roadmap for Q3",
    "createdAt": "2023-06-15T14:32:10Z",
    "updatedAt": "2023-06-16T09:15:22Z",
    "version": 12,
    "hypercoreKey": "8e45a7f...",
    "nodes": [
      {
        "id": "node_1",
        "type": "task",
        "position": { "x": 100, "y": 200 },
        "data": {
          "label": "Research Phase",
          "taskId": "task_123"
        }
      },
      // Additional nodes...
    ],
    "edges": [
      {
        "id": "edge_1",
        "source": "node_1",
        "target": "node_2",
        "type": "default",
        "label": "Next Step"
      },
      // Additional edges...
    ],
    "linkedTasks": [
      {
        "taskId": "task_123",
        "nodeId": "node_1"
      },
      // Additional task links...
    ]
  }
}
```

#### Update Flowchart

Updates an existing flowchart.

```
PUT /flowcharts/:id
```

**Request Body:**

```json
{
  "name": "Updated Project Roadmap",
  "description": "Revised development roadmap for Q3-Q4",
  "nodes": [...],  // Optional, full nodes array
  "edges": [...]   // Optional, full edges array
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "flow_abc123",
    "name": "Updated Project Roadmap",
    "version": 13,
    "updatedAt": "2023-06-18T10:22:45Z"
  }
}
```

#### Delete Flowchart

Deletes a flowchart.

```
DELETE /flowcharts/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Flowchart deleted successfully"
  }
}
```

#### Export Flowchart

Exports a flowchart in the specified format.

```
GET /flowcharts/:id/export?format=json|svg|png
```

**Response:**

For JSON format:
```json
{
  "success": true,
  "data": {
    "format": "json",
    "content": {
      "id": "flow_abc123",
      "name": "Project Roadmap",
      "nodes": [...],
      "edges": [...]
    }
  }
}
```

For SVG/PNG formats, returns binary data with appropriate Content-Type header.

### Version Control

#### Get Version History

Retrieves the version history for a flowchart.

```
GET /flowcharts/:id/versions
```

**Response:**

```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "version": 13,
        "timestamp": "2023-06-18T10:22:45Z",
        "author": "did:hapa:xyz123",
        "changes": {
          "nodesAdded": ["node_5"],
          "nodesModified": ["node_2"],
          "edgesAdded": ["edge_6"]
        }
      },
      // Previous versions...
    ]
  }
}
```

#### Revert to Version

Reverts a flowchart to a specific version.

```
POST /flowcharts/:id/revert
```

**Request Body:**

```json
{
  "version": 10
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Flowchart reverted to version 10",
    "currentVersion": 14
  }
}
```

### Task Manager Integration

#### List Available Tasks

Retrieves tasks from Hapa Task Manager that the user has access to.

```
GET /tasks
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_123",
        "title": "Complete research phase",
        "description": "Gather market data and competitor analysis",
        "status": "in-progress",
        "deadline": "2023-07-30T00:00:00Z",
        "assignedTo": ["did:hapa:user1", "did:hapa:user2"],
        "consulVotes": {
          "required": 2,
          "received": 1
        }
      },
      // Additional tasks...
    ]
  }
}
```

#### Get Task Details

Retrieves details for a specific task.

```
GET /tasks/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "title": "Complete research phase",
    "description": "Gather market data and competitor analysis",
    "status": "in-progress",
    "createdAt": "2023-06-10T08:15:30Z",
    "updatedAt": "2023-06-15T16:42:18Z",
    "deadline": "2023-07-30T00:00:00Z",
    "priority": 3,
    "assignedTo": [
      {
        "did": "did:hapa:user1",
        "name": "Alice"
      },
      {
        "did": "did:hapa:user2",
        "name": "Bob"
      }
    ],
    "creator": "did:hapa:admin1",
    "consulVotes": {
      "required": 2,
      "received": 1,
      "approved": false
    },
    "rewards": {
      "µCredits": 50,
      "distribution": {
        "contributors": 70,
        "auditors": 20,
        "builder": 10
      }
    },
    "linkedFlowcharts": [
      {
        "flowchartId": "flow_abc123",
        "name": "Project Roadmap"
      }
    ]
  }
}
```

#### Link Task to Flowchart

Links a task from Hapa Task Manager to a node in the flowchart.

```
POST /flowcharts/:id/tasks
```

**Request Body:**

```json
{
  "taskId": "task_123",
  "nodeId": "node_1"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Task linked to flowchart node",
    "taskId": "task_123",
    "nodeId": "node_1"
  }
}
```

#### Get Task Members

Retrieves members (DIDs) associated with a task.

```
GET /tasks/:id/members
```

**Response:**

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "did": "did:hapa:user1",
        "name": "Alice",
        "role": "contributor"
      },
      {
        "did": "did:hapa:user2",
        "name": "Bob",
        "role": "contributor"
      },
      {
        "did": "did:hapa:user3",
        "name": "Charlie",
        "role": "auditor"
      }
    ]
  }
}
```

### Collaboration

#### WebRTC Signaling

Sends WebRTC signaling data to establish peer connections.

```
POST /flowcharts/:id/signal
```

**Request Body:**

```json
{
  "peerId": "peer_123",
  "signal": {
    "type": "offer",
    "sdp": "v=0\no=- 2311582689742134295 2 IN..."
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Signal delivered"
  }
}
```

#### Join Hyperswarm

Joins a Hyperswarm network with the specified topic key.

```
POST /hyperswarm/join
```

**Request Body:**

```json
{
  "topic": "8e45a7f..."  // Typically the flowchart's hypercoreKey
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "peerId": "local_peer_id",
    "connected": true,
    "peerCount": 2
  }
}
```

#### Get Connected Peers

Retrieves currently connected peers for a flowchart.

```
GET /flowcharts/:id/peers
```

**Response:**

```json
{
  "success": true,
  "data": {
    "peers": [
      {
        "id": "peer_456",
        "did": "did:hapa:user2",
        "name": "Bob",
        "lastSeen": "2023-06-18T14:25:10Z"
      },
      {
        "id": "peer_789",
        "did": "did:hapa:user3",
        "name": "Charlie",
        "lastSeen": "2023-06-18T14:26:05Z"
      }
    ]
  }
}
```

### AI Features (Gatekeeper)

#### Get Flowchart Suggestions

Retrieves AI-generated suggestions for improving the flowchart.

```
POST /flowcharts/:id/suggestions
```

**Request Body:**

```json
{
  "flowchartData": {
    "nodes": [...],
    "edges": [...]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "LAYOUT",
        "description": "Rearrange nodes in a left-to-right flow for better readability"
      },
      {
        "type": "CONNECTION",
        "description": "Add an edge between 'Research' and 'Analysis' nodes to complete the flow"
      },
      {
        "type": "SIMPLIFICATION",
        "description": "Merge the three approval nodes into a single decision node with multiple outputs"
      }
    ]
  }
}
```

#### Auto-Layout Flowchart

Applies AI-powered automatic layout to the flowchart.

```
POST /flowcharts/:id/auto-layout
```

**Request Body:**

```json
{
  "algorithm": "balanced",  // Options: "balanced", "compact", "hierarchical"
  "direction": "LR"         // Options: "LR" (left-to-right), "TB" (top-to-bottom)
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "updatedPositions": {
      "node_1": { "x": 100, "y": 200 },
      "node_2": { "x": 300, "y": 200 },
      "node_3": { "x": 500, "y": 150 },
      // Additional node positions...
    }
  }
}
```

## WebSocket API

In addition to REST endpoints, the API provides WebSocket connections for real-time updates:

```
ws://localhost:3000/ws/flowcharts/:id
```

### Message Types

#### Join Flowchart

```json
{
  "type": "join",
  "flowchartId": "flow_abc123",
  "userId": "did:hapa:user1",
  "metadata": {
    "name": "Alice"
  }
}
```

#### Cursor Update

```json
{
  "type": "cursor",
  "userId": "did:hapa:user1",
  "position": {
    "x": 150,
    "y": 275
  }
}
```

#### Flowchart Update

```json
{
  "type": "update",
  "userId": "did:hapa:user1",
  "changes": {
    "nodes": [
      {
        "id": "node_4",
        "type": "add",
        "data": {
          // Node data...
        }
      },
      {
        "id": "node_2",
        "type": "update",
        "data": {
          // Updated node data...
        }
      }
    ],
    "edges": [
      {
        "id": "edge_3",
        "type": "remove"
      }
    ]
  },
  "version": 14
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Flowchart with ID flow_xyz789 not found",
    "details": {
      // Additional error details (if available)
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request body or parameters are invalid |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `UNAUTHORIZED` | Authentication required or insufficient permissions |
| `TASK_MANAGER_ERROR` | Error when communicating with Hapa Task Manager |
| `HYPERCORE_ERROR` | Error related to Hypercore operations |
| `WEBRTC_ERROR` | Error during WebRTC signaling or connection |
| `AI_SERVICE_ERROR` | Error in AI service (Gatekeeper) |
| `SERVER_ERROR` | Unexpected server error |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- 100 requests per minute per IP address
- 20 WebRTC signaling requests per minute per flowchart
- 5 AI suggestion requests per minute per user

Rate limit response (HTTP 429):

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "resetAt": "2023-06-18T14:35:10Z",
      "limit": 100,
      "remaining": 0
    }
  }
}
```

## Testing the API

For development and testing purposes, you can:

1. **Use the simulation mode**: Directly join flowcharts using a Hypercore ID
2. **Create test flowcharts**: Generate sample flowcharts for testing
3. **Mock Task Manager API**: Use a mock server that simulates the Hapa Task Manager API

Example test endpoint:

```
POST /dev/test-flowchart
```

**Request Body:**

```json
{
  "nodeCount": 10,
  "mockTasks": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "flowchartId": "test_flow_123",
    "hypercoreKey": "test_key_456",
    "nodes": [...],
    "edges": [...]
  }
}
``` 