import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings } from '../../types';

const defaultSettings: AppSettings = {
  theme: 'system',
  autosave: true,
  autoLayout: false,
  snapToGrid: true,
  gridSize: 20,
  language: 'en',
};

// Load persisted settings from localStorage if available
const loadSavedSettings = (): AppSettings => {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const savedSettings = localStorage.getItem('hapaFlowchartSettings');
    if (savedSettings) {
      return { ...defaultSettings, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  
  return defaultSettings;
};

const initialState: AppSettings = loadSavedSettings();

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      persistSettings(state);
    },
    
    setAutosave: (state, action: PayloadAction<boolean>) => {
      state.autosave = action.payload;
      persistSettings(state);
    },
    
    setAutoLayout: (state, action: PayloadAction<boolean>) => {
      state.autoLayout = action.payload;
      persistSettings(state);
    },
    
    setSnapToGrid: (state, action: PayloadAction<boolean>) => {
      state.snapToGrid = action.payload;
      persistSettings(state);
    },
    
    setGridSize: (state, action: PayloadAction<number>) => {
      state.gridSize = action.payload;
      persistSettings(state);
    },
    
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
      persistSettings(state);
    },
    
    resetSettings: (state) => {
      Object.assign(state, defaultSettings);
      persistSettings(state);
    },
  },
});

// Helper to persist settings to localStorage
const persistSettings = (settings: AppSettings): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('hapaFlowchartSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
};

export const {
  setTheme,
  setAutosave,
  setAutoLayout,
  setSnapToGrid,
  setGridSize,
  setLanguage,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer; 