# Frontend Documentation - Hapa Flowchart

## UI Framework & Technology Stack

- **Primary Framework:** React.js
- **Styling:** Tailwind CSS with custom theme extensions
- **Flowchart Library:** React Flow (for node-based diagrams)
- **Build System:** Vite for fast development and optimized production builds
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
│   ├── HyperswarmWebRTCService.js
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

The Canvas is the central component where users create and edit flowcharts:

```jsx
// Canvas.jsx
import { useCallback } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'react-flow-renderer';
import { useSelector, useDispatch } from 'react-redux';
import { updateNodePosition, addNode, connectNodes } from '../redux/slices/flowchartSlice';
import CustomNode from './NodeTypes/CustomNode';
import TaskNode from './NodeTypes/TaskNode';

const nodeTypes = {
  custom: CustomNode,
  task: TaskNode,
};

const Canvas = () => {
  const dispatch = useDispatch();
  const { nodes, edges, selectedNode } = useSelector((state) => state.flowchart);
  
  const onNodeDragStop = useCallback((event, node) => {
    dispatch(updateNodePosition({ id: node.id, position: node.position }));
  }, [dispatch]);
  
  const onConnect = useCallback((params) => {
    dispatch(connectNodes(params));
  }, [dispatch]);
  
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default Canvas;
```

### TaskNode Component

TaskNode integrates with the Hapa Task Manager to display and link tasks:

```jsx
// TaskNode.jsx
import { memo } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTaskDetails } from '../../redux/slices/taskManagerSlice';

const TaskNode = ({ id, data }) => {
  const dispatch = useDispatch();
  const taskDetails = useSelector((state) => 
    state.taskManager.tasks.find(task => task.id === data.taskId)
  );
  
  const handleClick = () => {
    if (!taskDetails && data.taskId) {
      dispatch(fetchTaskDetails(data.taskId));
    }
  };
  
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-500" onClick={handleClick}>
      <Handle type="target" position={Position.Top} />
      <div className="flex flex-col">
        <div className="flex items-center">
          <div className="ml-2">
            <div className="text-lg font-bold">{data.label}</div>
            {taskDetails && (
              <div className="text-gray-500">
                Status: {taskDetails.status}
              </div>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(TaskNode);
```

### CollaborationPanel Component

The CollaborationPanel facilitates real-time collaboration between users:

```jsx
// CollaborationPanel.jsx
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  updatePeerCursor, 
  initializeConnection,
  broadcastChange
} from '../../redux/slices/collaborationSlice';
import UserCursor from './UserCursor';
import LiveIndicator from './LiveIndicator';

const CollaborationPanel = () => {
  const dispatch = useDispatch();
  const { peers, connectionStatus, cursorPositions } = useSelector((state) => state.collaboration);
  const { nodes, edges } = useSelector((state) => state.flowchart);
  const [shareKey, setShareKey] = useState('');
  
  useEffect(() => {
    // Set up event listener for cursor movement
    const trackCursor = (e) => {
      const position = { x: e.clientX, y: e.clientY };
      dispatch(broadcastChange({ type: 'CURSOR_MOVE', payload: position }));
    };
    
    document.addEventListener('mousemove', trackCursor);
    return () => document.removeEventListener('mousemove', trackCursor);
  }, [dispatch]);
  
  const handleConnect = () => {
    dispatch(initializeConnection(shareKey));
  };
  
  return (
    <div className="fixed right-0 top-20 bg-white p-4 shadow-lg rounded-l-lg">
      <h3 className="font-bold text-lg mb-4">Collaboration</h3>
      
      {connectionStatus === 'disconnected' ? (
        <div>
          <input 
            type="text" 
            value={shareKey} 
            onChange={(e) => setShareKey(e.target.value)}
            placeholder="Enter share key"
            className="p-2 border rounded mb-2 w-full"
          />
          <button 
            onClick={handleConnect}
            className="bg-blue-500 text-white p-2 rounded w-full"
          >
            Connect
          </button>
        </div>
      ) : (
        <>
          <LiveIndicator status={connectionStatus} />
          <div className="mt-2">
            <p>Connected Peers: {peers.length}</p>
            <div className="mt-2">
              {Object.entries(cursorPositions).map(([peerId, position]) => (
                <UserCursor key={peerId} position={position} peerId={peerId} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CollaborationPanel;
```

## Redux Store

Redux Toolkit is used for global state management:

```js
// store.js
import { configureStore } from '@reduxjs/toolkit';
import flowchartReducer from './slices/flowchartSlice';
import collaborationReducer from './slices/collaborationSlice';
import taskManagerReducer from './slices/taskManagerSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    flowchart: flowchartReducer,
    collaboration: collaborationReducer,
    taskManager: taskManagerReducer,
    user: userReducer,
  },
});

export default store;
```

### Flowchart Slice

```js
// flowchartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { saveFlowchart, loadFlowchart } from '../../services/hypercoreService';

export const saveFlowchartAsync = createAsyncThunk(
  'flowchart/save',
  async (_, { getState }) => {
    const { nodes, edges } = getState().flowchart;
    const result = await saveFlowchart({ nodes, edges });
    return result;
  }
);

export const loadFlowchartAsync = createAsyncThunk(
  'flowchart/load',
  async (flowchartId) => {
    const result = await loadFlowchart(flowchartId);
    return result;
  }
);

const flowchartSlice = createSlice({
  name: 'flowchart',
  initialState: {
    nodes: [],
    edges: [],
    selectedNode: null,
    flowchartId: null,
    loading: false,
    error: null,
  },
  reducers: {
    addNode: (state, action) => {
      state.nodes.push(action.payload);
    },
    updateNodePosition: (state, action) => {
      const { id, position } = action.payload;
      const node = state.nodes.find(n => n.id === id);
      if (node) {
        node.position = position;
      }
    },
    connectNodes: (state, action) => {
      const { source, target } = action.payload;
      state.edges.push({
        id: `${source}-${target}`,
        source,
        target,
      });
    },
    selectNode: (state, action) => {
      state.selectedNode = action.payload;
    },
    // Additional reducers...
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveFlowchartAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveFlowchartAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.flowchartId = action.payload.id;
      })
      .addCase(saveFlowchartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Additional cases for loadFlowchartAsync...
  },
});

export const { addNode, updateNodePosition, connectNodes, selectNode } = flowchartSlice.actions;
export default flowchartSlice.reducer;
```

## Local Services

### WebRTC Service

```js
// webrtcService.js
import Peer from 'simple-peer';

class WebRTCService {
  constructor() {
    this.peers = {};
    this.onConnectionCallback = null;
    this.onDataCallback = null;
    this.onCloseCallback = null;
  }
  
  initializePeer(isInitiator, signalData = null) {
    const peer = new Peer({
      initiator: isInitiator,
      trickle: false,
    });
    
    peer.on('signal', (data) => {
      if (this.onSignalCallback) {
        this.onSignalCallback(data);
      }
    });
    
    peer.on('connect', () => {
      if (this.onConnectionCallback) {
        this.onConnectionCallback(peer);
      }
    });
    
    peer.on('data', (data) => {
      if (this.onDataCallback) {
        this.onDataCallback(JSON.parse(data.toString()));
      }
    });
    
    peer.on('close', () => {
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    });
    
    if (signalData) {
      peer.signal(signalData);
    }
    
    return peer;
  }
  
  sendData(peerId, data) {
    if (this.peers[peerId] && this.peers[peerId].connected) {
      this.peers[peerId].send(JSON.stringify(data));
      return true;
    }
    return false;
  }
  
  broadcastData(data) {
    Object.values(this.peers).forEach(peer => {
      if (peer.connected) {
        peer.send(JSON.stringify(data));
      }
    });
  }
  
  // Event handlers setup
  onSignal(callback) {
    this.onSignalCallback = callback;
  }
  
  onConnection(callback) {
    this.onConnectionCallback = callback;
  }
  
  onData(callback) {
    this.onDataCallback = callback;
  }
  
  onClose(callback) {
    this.onCloseCallback = callback;
  }
  
  // Cleanup
  destroy() {
    Object.values(this.peers).forEach(peer => peer.destroy());
    this.peers = {};
  }
}

export default new WebRTCService();
```

## Web-specific Optimizations

### Progressive Web App Setup

The application is configured as a Progressive Web App (PWA) to provide an app-like experience in the browser:

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Hapa Flowchart',
        short_name: 'Hapa Flow',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
```

### Service Worker for Offline Support

```js
// src/serviceWorker.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache all assets generated by your build process
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses
registerRoute(
  /^https:\/\/api\.hapaai\.com\/v1/,
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
  })
);

// Cache images with a Cache First strategy
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif)$/,
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);
```

### IndexedDB for Local Persistence

```js
// src/services/storageService.js
import { openDB } from 'idb';

const DB_NAME = 'hapa-flowchart-db';
const DB_VERSION = 1;
const FLOWCHART_STORE = 'flowcharts';
const TASKS_STORE = 'tasks';

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(FLOWCHART_STORE)) {
        db.createObjectStore(FLOWCHART_STORE, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function saveFlowchartToLocal(flowchart) {
  const db = await initDB();
  return db.put(FLOWCHART_STORE, flowchart);
}

export async function getFlowchartFromLocal(id) {
  const db = await initDB();
  return db.get(FLOWCHART_STORE, id);
}

export async function getAllFlowcharts() {
  const db = await initDB();
  return db.getAll(FLOWCHART_STORE);
}

export async function saveTaskToLocal(task) {
  const db = await initDB();
  return db.put(TASKS_STORE, task);
}

export async function getTaskFromLocal(id) {
  const db = await initDB();
  return db.get(TASKS_STORE, id);
}

export async function getAllTasks() {
  const db = await initDB();
  return db.getAll(TASKS_STORE);
}
```

## Responsive Design

The application is designed to be responsive across desktop and mobile browsers:

```jsx
// src/components/layout/Layout.jsx
import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Canvas from '../flowchart/Canvas';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="h-screen flex flex-col">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          className={`transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-0'
          } md:w-64`} 
        />
        <main className="flex-1 overflow-hidden">
          <Canvas />
        </main>
      </div>
    </div>
  );
};

export default Layout;
```

## Theming and Accessibility

### Theme Configuration

```js
// src/styles/theme.js
const colors = {
  primary: {
    50: '#e6f7ff',
    100: '#bae7ff',
    // ...other shades
    500: '#1890ff', // Main primary color
    // ...other shades
    900: '#003a8c',
  },
  // ...other color definitions
};

const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  // ...other sizes
};

const theme = {
  colors,
  fontSizes,
  // ...other theme values
};

export default theme;
```

### Accessibility Hooks

```js
// src/hooks/useA11y.js
import { useEffect, useCallback } from 'react';

export function useA11y() {
  const handleKeyNavigation = useCallback((e) => {
    // Implementation of keyboard navigation
    // For example, arrow keys to navigate between nodes
  }, []);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyNavigation);
    return () => document.removeEventListener('keydown', handleKeyNavigation);
  }, [handleKeyNavigation]);
  
  // Additional accessibility features
  
  return {
    // Exported accessibility utilities
  };
}
```

## Error Handling and Logging

```js
// src/utils/errorHandler.js
import * as Sentry from '@sentry/browser';

// Initialize error tracking (in production only)
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}

export function logError(error, context = {}) {
  console.error(error);
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

export function ErrorBoundary({ children }) {
  if (process.env.NODE_ENV !== 'production') {
    return children;
  }
  
  return (
    <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

## Development Workflow

The application uses Vite for a modern, fast development workflow:

1. **Development Mode**: `npm run dev` - Starts the development server with hot module replacement
2. **Build**: `npm run build` - Creates optimized production build
3. **Preview**: `npm run preview` - Locally preview production build
4. **Test**: `npm run test` - Runs test suite using Vitest
5. **Lint**: `npm run lint` - Runs ESLint to check code quality

### Development Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@types/react": "^18.0.28",
    "@vitejs/plugin-react": "^3.1.0",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.36.0",
    "eslint-plugin-react": "^7.32.2",
    "postcss": "^8.4.21",
    "tailwindcss": "^3.2.7",
    "vite": "^4.2.0",
    "vite-plugin-pwa": "^0.14.4",
    "vitest": "^0.29.7"
  }
}
```

## Internationalization

The application supports multiple languages through i18next:

```jsx
// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // English translations
      'app.title': 'Hapa Flowchart',
      'canvas.addNode': 'Add Node',
      // ...more translations
    },
  },
  es: {
    translation: {
      // Spanish translations
      'app.title': 'Diagrama de Flujo Hapa',
      'canvas.addNode': 'Añadir Nodo',
      // ...more translations
    },
  },
  // ...other languages
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

## Conclusion

The Hapa Flowchart frontend is built as a modern web application focusing on responsive design, offline capabilities, and real-time collaboration. By leveraging the power of React, Redux, and WebRTC, the application provides a seamless, intuitive interface for creating and sharing flowcharts within the Hapa ecosystem. 