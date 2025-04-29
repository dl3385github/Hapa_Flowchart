# Frontend Documentation - Hapa Flowchart

## UI Framework & Technology Stack

- **Primary Framework:** React.js
- **Styling:** Tailwind CSS with custom theme extensions
- **Flowchart Library:** React Flow (for node-based diagrams)
- **Build System:** Vite for fast development and optimized production builds
- **Desktop Wrapper:** Electron for cross-platform desktop application
- **State Management:** Redux Toolkit for global state, React Query for API data
- **Real-time Communication:** WebRTC via simple-peer for P2P connections
- **Local Storage:** IndexedDB for offline-first capability

## Application Architecture

### Component Structure

```
src/
├── components/
│   ├── core/              # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Tooltip.jsx
│   │   └── ...
│   ├── flowchart/         # Flowchart-specific components
│   │   ├── Canvas.jsx     # Main flowchart editing area
│   │   ├── NodeTypes/     # Custom node implementations
│   │   ├── EdgeTypes/     # Custom edge implementations
│   │   └── ...
│   ├── layout/            # Layout components
│   │   ├── Sidebar.jsx
│   │   ├── Toolbar.jsx
│   │   ├── Header.jsx
│   │   └── ...
│   ├── taskmanager/       # Task Manager integration components
│   │   ├── TaskBrowser.jsx
│   │   ├── TaskNode.jsx
│   │   └── ...
│   └── collaboration/     # Collaboration components
│       ├── UserCursor.jsx
│       ├── LiveIndicator.jsx
│       ├── VersionHistory.jsx
│       └── ...
├── hooks/                 # Custom React hooks
│   ├── useFlowchart.js
│   ├── usePeerConnection.js
│   ├── useTaskManager.js
│   └── ...
├── redux/                 # Redux state management
│   ├── store.js
│   ├── slices/
│   │   ├── flowchartSlice.js
│   │   ├── collaborationSlice.js
│   │   └── ...
├── services/              # Service layer for API calls
│   ├── taskManagerApi.js
│   ├── hypercoreService.js
│   ├── webrtcService.js
│   └── ...
├── utils/                 # Utility functions
│   ├── flowchartUtils.js
│   ├── cryptoUtils.js
│   ├── validators.js
│   └── ...
└── pages/                 # Full pages of the application
    ├── Dashboard.jsx
    ├── Editor.jsx
    ├── TaskBrowser.jsx
    └── ...
```

## Key Components

### Canvas Component
The primary workspace where users create and edit flowcharts.

```jsx
// Canvas.jsx - Simplified example
import React, { useCallback } from 'react';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import { useSelector, useDispatch } from 'react-redux';
import { updateFlowchart } from '../redux/slices/flowchartSlice';
import CustomNodeTypes from './NodeTypes';
import CustomEdgeTypes from './EdgeTypes';

const Canvas = () => {
  const flowchartData = useSelector(state => state.flowchart.current);
  const dispatch = useDispatch();

  const onNodesChange = useCallback(changes => {
    dispatch(updateFlowchart({ nodes: changes, type: 'nodes' }));
  }, [dispatch]);

  const onEdgesChange = useCallback(changes => {
    dispatch(updateFlowchart({ edges: changes, type: 'edges' }));
  }, [dispatch]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={flowchartData.nodes}
        edges={flowchartData.edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={CustomNodeTypes}
        edgeTypes={CustomEdgeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default Canvas;
```

### TaskNode Component
A specialized node that connects to Hapa Task Manager data.

```jsx
// TaskNode.jsx - Simplified example
import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { fetchTaskDetails } from '../services/taskManagerApi';

const TaskNode = ({ data, id }) => {
  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data.taskId) {
      setLoading(true);
      fetchTaskDetails(data.taskId)
        .then(details => setTaskDetails(details))
        .catch(err => console.error('Failed to fetch task details:', err))
        .finally(() => setLoading(false));
    }
  }, [data.taskId]);

  return (
    <div className="task-node border-2 p-4 rounded bg-white shadow-md">
      <Handle type="target" position={Position.Top} />
      
      <div className="task-node-header font-bold">{data.label}</div>
      
      {loading ? (
        <div className="text-sm">Loading task details...</div>
      ) : taskDetails ? (
        <div className="task-details mt-2">
          <div className="text-sm">Status: {taskDetails.status}</div>
          <div className="text-sm">Assigned: {taskDetails.assignedTo.length} members</div>
          <div className="text-sm">Deadline: {new Date(taskDetails.deadline).toLocaleDateString()}</div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No task connected</div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default TaskNode;
```

### CollaborationPanel Component
Interface for real-time collaboration features.

```jsx
// CollaborationPanel.jsx - Simplified example
import React from 'react';
import { useSelector } from 'react-redux';
import UserAvatar from '../core/UserAvatar';
import { usePeerConnections } from '../hooks/usePeerConnection';

const CollaborationPanel = () => {
  const connectedPeers = useSelector(state => state.collaboration.peers);
  const { sendMessage } = usePeerConnections();

  return (
    <div className="collaboration-panel bg-gray-100 p-4 rounded">
      <h3 className="text-lg font-bold mb-4">Collaborators ({connectedPeers.length})</h3>
      
      <div className="collaborators-list">
        {connectedPeers.map(peer => (
          <div key={peer.id} className="flex items-center mb-2">
            <UserAvatar did={peer.did} size="sm" />
            <span className="ml-2">{peer.name || peer.did.substring(0, 10)}</span>
            <div className="ml-auto">
              <span className={`h-3 w-3 rounded-full inline-block ${peer.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="share-section mt-4 pt-4 border-t">
        <h4 className="font-medium mb-2">Share Flowchart</h4>
        <div className="flex">
          <input 
            type="text" 
            value={useSelector(state => state.flowchart.currentId)} 
            className="text-sm p-2 border rounded flex-grow" 
            readOnly 
          />
          <button 
            className="ml-2 bg-blue-500 text-white p-2 rounded"
            onClick={() => navigator.clipboard.writeText(
              useSelector(state => state.flowchart.currentId)
            )}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;
```

## State Management

### Redux Store Structure

```js
// Simplified store structure
{
  flowchart: {
    current: {
      id: "flow-123456",
      nodes: [...],
      edges: [...],
      version: 12,
      lastModified: "2023-06-15T14:32:10Z"
    },
    history: [...],   // Previous versions for undo/redo
    saved: true,      // Indicates if changes have been saved
    templates: [...]  // Available flowchart templates
  },
  tasks: {
    items: [...],     // Task data from Hapa Task Manager
    loading: false,
    error: null
  },
  collaboration: {
    peers: [...],     // Connected peers
    cursors: {...},   // Current cursor positions
    myId: "peer-xyz", // Local peer ID
    connected: true,  // Connected to P2P network
    swarmKey: "..."   // Current Hyperswarm key
  },
  ui: {
    sidebar: {
      open: true,
      activeTab: "elements"
    },
    zoom: 1,
    theme: "light"
  }
}
```

### Using React Query for Task Data

```js
// Example hook for fetching task data
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchUserTasks, createTask, updateTask } from '../services/taskManagerApi';

export function useTaskManager() {
  const queryClient = useQueryClient();
  
  // Fetch tasks the user has access to
  const tasksQuery = useQuery('user-tasks', fetchUserTasks, {
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true,
  });
  
  // Mutation for creating a new task
  const createTaskMutation = useMutation(createTask, {
    onSuccess: () => {
      // Invalidate and refetch tasks after creation
      queryClient.invalidateQueries('user-tasks');
    },
  });
  
  // Mutation for updating an existing task
  const updateTaskMutation = useMutation(updateTask, {
    onSuccess: (data, variables) => {
      // Optimistically update the task in the cache
      queryClient.setQueryData('user-tasks', oldData => {
        return oldData.map(task => 
          task.id === variables.id ? { ...task, ...data } : task
        );
      });
    },
  });
  
  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
  };
}
```

## WebRTC P2P Integration

### Peer Connection Hook

```js
// Simplified hook for WebRTC connections
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Peer from 'simple-peer';
import { 
  addPeer, 
  removePeer, 
  updatePeerCursor,
  setPeerId 
} from '../redux/slices/collaborationSlice';
import { applyRemoteChanges } from '../redux/slices/flowchartSlice';

export function usePeerConnections() {
  const dispatch = useDispatch();
  const flowchartId = useSelector(state => state.flowchart.current.id);
  const myPeerId = useSelector(state => state.collaboration.myId);
  
  // Initialize connection to Hyperswarm with flowchart ID
  useEffect(() => {
    if (!flowchartId) return;
    
    // Connect to hyperswarm with flowchart ID as topic
    const swarmConnection = connectToHyperswarm(flowchartId);
    
    // When we discover a new peer
    swarmConnection.on('peer', (peerInfo) => {
      const peer = new Peer({ initiator: true });
      
      peer.on('signal', data => {
        // Send our signal data to the peer via Hyperswarm
        swarmConnection.sendTo(peerInfo.id, JSON.stringify({
          type: 'signal',
          sender: myPeerId,
          data
        }));
      });
      
      peer.on('connect', () => {
        dispatch(addPeer({
          id: peerInfo.id,
          did: peerInfo.did, // If available
          connected: true
        }));
      });
      
      peer.on('data', data => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'cursor') {
          dispatch(updatePeerCursor({
            peerId: peerInfo.id,
            position: message.position
          }));
        } else if (message.type === 'flowchart-change') {
          dispatch(applyRemoteChanges(message.changes));
        }
      });
      
      peer.on('close', () => {
        dispatch(removePeer(peerInfo.id));
      });
    });
    
    return () => {
      swarmConnection.destroy();
    };
  }, [flowchartId, myPeerId, dispatch]);
  
  // Function to send flowchart changes to all peers
  const sendFlowchartChanges = useCallback((changes) => {
    const peers = useSelector(state => state.collaboration.peers);
    
    peers.forEach(peer => {
      if (peer.connection && peer.connected) {
        peer.connection.send(JSON.stringify({
          type: 'flowchart-change',
          changes
        }));
      }
    });
  }, []);
  
  return {
    sendFlowchartChanges,
    // Other methods for P2P communication
  };
}
```

## Theming & Styling

The application uses Tailwind CSS with a custom theme extension to maintain consistent styling that aligns with the Hapa ecosystem's visual identity.

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'hapa-primary': '#3B82F6',
        'hapa-secondary': '#10B981',
        'hapa-accent': '#8B5CF6',
        'hapa-background': '#F9FAFB',
        'hapa-surface': '#FFFFFF',
        'hapa-error': '#EF4444',
        'hapa-warning': '#F59E0B',
        'hapa-success': '#10B981',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'node': '0 2px 5px rgba(0, 0, 0, 0.1)',
        'node-selected': '0 0 0 2px #3B82F6, 0 2px 5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
      backgroundColor: ['active'],
    },
  },
  plugins: [],
};
```

## Accessibility Considerations

- All interactive elements have appropriate ARIA labels
- Keyboard navigation supported throughout the application
- Color contrast ratios meet WCAG 2.1 AA standards
- Screen reader announcements for important state changes
- Focus management for modal dialogs and popovers
- Responsive design principles for various device sizes

## Performance Optimizations

- Canvas rendering optimization with React.memo and useMemo
- Virtualization for large flowcharts (only render visible nodes)
- Throttled updates for real-time cursor movements
- Lazy loading of non-critical components
- Service worker for offline capabilities and faster loading
- IndexedDB for client-side storage of flowchart data
- Compression of data sent over WebRTC connections

## Internationalization (i18n)

The application supports internationalization through react-i18next:

```jsx
// Example of i18n implementation
import { useTranslation } from 'react-i18next';

function Toolbar() {
  const { t } = useTranslation();
  
  return (
    <div className="toolbar">
      <button title={t('toolbar.add_node')}>+</button>
      <button title={t('toolbar.delete')}>{t('toolbar.delete')}</button>
      <button title={t('toolbar.undo')}>{t('toolbar.undo')}</button>
      <button title={t('toolbar.redo')}>{t('toolbar.redo')}</button>
    </div>
  );
}
```

## Error Handling

- Global error boundary to catch and log unexpected errors
- Structured error handling for API calls with retry logic
- Offline detection and automatic reconnection
- Helpful error messages with suggested actions for users
- Fallback UI components when data is unavailable

## Development Workflow

1. Develop components in isolation using Storybook
2. Write unit tests with Jest and React Testing Library
3. Integration testing for critical user flows
4. Use ESLint and Prettier for code quality
5. Pre-commit hooks for formatting and linting
6. CI/CD pipeline for automated testing and deployment 