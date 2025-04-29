import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language resources
const resources = {
  en: {
    translation: {
      // Common
      app_name: 'Hapa Flowchart',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      share: 'Share',
      
      // Navigation
      dashboard: 'Dashboard',
      flowcharts: 'Flowcharts',
      settings: 'Settings',
      help: 'Help',
      
      // Flowchart Editor
      new_flowchart: 'New Flowchart',
      add_node: 'Add Node',
      connect_nodes: 'Connect Nodes',
      delete_selected: 'Delete Selected',
      undo: 'Undo',
      redo: 'Redo',
      
      // Node Types
      process: 'Process',
      decision: 'Decision',
      start_end: 'Start/End',
      input_output: 'Input/Output',
      task: 'Task',
      
      // Task Integration
      connect_to_task_manager: 'Connect to Task Manager',
      link_to_task: 'Link to Task',
      view_task_details: 'View Task Details',
      
      // Collaboration
      invite_collaborators: 'Invite Collaborators',
      share_key: 'Share Key',
      active_collaborators: 'Active Collaborators',
      
      // Settings
      language: 'Language',
      theme: 'Theme',
      grid_settings: 'Grid Settings',
      auto_save: 'Auto Save',
      
      // Errors
      connection_error: 'Connection Error',
      save_error: 'Error Saving',
      generic_error: 'Something went wrong',
    },
  },
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  });

export default i18n; 