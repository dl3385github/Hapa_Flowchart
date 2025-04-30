import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '../../types';

const initialState: UIState = {
  sidebarOpen: true,
  sidebarMinimized: false,
  propertyPanelOpen: false,
  activePanel: null,
  selectedElements: {
    nodes: [],
    edges: [],
  },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    
    toggleSidebarMinimized: (state) => {
      state.sidebarMinimized = !state.sidebarMinimized;
    },
    
    setSidebarMinimized: (state, action: PayloadAction<boolean>) => {
      state.sidebarMinimized = action.payload;
    },
    
    togglePropertyPanel: (state) => {
      state.propertyPanelOpen = !state.propertyPanelOpen;
    },
    
    setPropertyPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.propertyPanelOpen = action.payload;
    },
    
    setActivePanel: (state, action: PayloadAction<string | null>) => {
      state.activePanel = action.payload;
    },
    
    setSelectedElements: (state, action: PayloadAction<{ nodes: string[]; edges: string[] }>) => {
      state.selectedElements = action.payload;
    },
    
    clearSelection: (state) => {
      state.selectedElements = {
        nodes: [],
        edges: [],
      };
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarMinimized,
  setSidebarMinimized,
  togglePropertyPanel,
  setPropertyPanelOpen,
  setActivePanel,
  setSelectedElements,
  clearSelection,
} = uiSlice.actions;

export default uiSlice.reducer; 