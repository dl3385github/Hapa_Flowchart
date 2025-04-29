import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import flowchartsReducer from './slices/flowchartsSlice';
import uiReducer from './slices/uiSlice';
import settingsReducer from './slices/settingsSlice';
import collaborationReducer from './slices/collaborationSlice';

export const store = configureStore({
  reducer: {
    flowcharts: flowchartsReducer,
    ui: uiReducer,
    settings: settingsReducer,
    collaboration: collaborationReducer,
  },
  // Add middleware for non-serializable data like WebRTC connections in dev mode only
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['collaboration/setPeerConnection', 'collaboration/updatePeers'],
        ignoredPaths: ['collaboration.peerConnections'],
      },
    }),
});

// Enable refetchOnFocus/refetchOnReconnect behaviors for RTK Query
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 