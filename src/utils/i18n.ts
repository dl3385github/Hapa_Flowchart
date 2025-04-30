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
      my_flowcharts: 'My Flowcharts',
      
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
      process_description: 'A process or action step',
      decision_description: 'A decision point with multiple paths',
      start_end_description: 'Starting or ending point of the flowchart',
      task_description: 'A task linked to Hapa Task Manager',
      data_description: 'Data input or output',
      
      // Task Integration
      connect_to_task_manager: 'Connect to Task Manager',
      link_to_task: 'Link to Task',
      view_task_details: 'View Task Details',
      
      // Collaboration
      invite_collaborators: 'Invite Collaborators',
      share_key: 'Share Key',
      active_collaborators: 'Active Collaborators',
      join_flowchart: 'Join Flowchart',
      hypercore_key: 'Hypercore Key',
      paste_hypercore_key: 'Paste the Hypercore key here',
      connecting: 'Connecting...',
      join: 'Join',
      please_enter_key: 'Please enter a Hypercore key',
      connection_failed: 'Connection failed. Please try again.',
      join_flowchart_instruction: 'Enter the Hypercore key shared with you to join and collaborate on a flowchart.',
      collaborators: 'Collaborators',
      show_collaborators: 'Show Collaborators',
      online: 'Online',
      offline: 'Offline',
      you: 'You',
      last_seen: 'Last seen',
      just_now: 'just now',
      minutes_ago: '{{count}} minute ago',
      minutes_ago_plural: '{{count}} minutes ago',
      hours_ago: '{{count}} hour ago',
      hours_ago_plural: '{{count}} hours ago',
      days_ago: '{{count}} day ago',
      days_ago_plural: '{{count}} days ago',
      
      // Join Flowchart FAQ
      frequently_asked_questions: 'Frequently Asked Questions',
      where_to_find_key: 'Where do I find the Hypercore key?',
      find_key_explanation: 'The person who created the flowchart can share the key with you. They can find it by clicking the "Share" button in the flowchart editor.',
      connection_issues: 'What if I have connection issues?',
      connection_issues_explanation: 'Make sure you have a stable internet connection and that the key is correct. If problems persist, try rejoining or contact the flowchart owner.',
      privacy_security: 'Is my data secure?',
      privacy_security_explanation: 'Yes, Hapa Flowchart uses end-to-end encryption and peer-to-peer connections. Your data remains private and is only shared with authorized collaborators.',
      
      // P2P Specific
      searching_for_peers: 'Searching for peers in the network...',
      retrying_connection: 'Retrying connection...',
      retry: 'Retry',
      webrtc_initialization_failed: 'Failed to initialize P2P connection',
      what_is_p2p: 'What is peer-to-peer (P2P)?',
      p2p_explanation: 'Peer-to-peer means your device connects directly to other users without going through a central server. This makes collaboration faster and more private, but requires all participants to be online at the same time.',
      waiting_for_peers: 'Waiting for peers to connect',
      failed_to_generate_key: 'Failed to generate sharing key',
      
      // Editor Toolbar
      toggle_sidebar: 'Toggle Sidebar',
      go_back: 'Go Back',
      auto_layout: 'Auto Layout',
      connect_to_task: 'Connect to Task',
      toggle_properties: 'Toggle Properties',
      share_flowchart: 'Share Flowchart',
      copied_to_clipboard: 'Copied to clipboard',
      share_key_description: 'Share this key with collaborators so they can join this flowchart.',
      p2p_status: 'P2P Status',
      ready_for_collaboration: 'Ready for collaboration',
      close: 'Close',
      
      // Settings
      language: 'Language',
      theme: 'Theme',
      grid_settings: 'Grid Settings',
      auto_save: 'Auto Save',
      
      // Errors
      connection_error: 'Connection Error',
      save_error: 'Error Saving',
      generic_error: 'Something went wrong',
      
      // Dashboard
      recent_flowcharts: 'Recent Flowcharts',
      no_flowcharts_yet: 'You haven\'t created any flowcharts yet',
      create_first_flowchart: 'Create your first flowchart',
      name: 'Name',
      description: 'Description',
      optional: 'optional',
      flowchart_name_placeholder: 'Enter flowchart name',
      flowchart_description_placeholder: 'Enter a brief description',
      create: 'Create',
      confirm_delete_flowchart: 'Are you sure you want to delete this flowchart?',
      
      // Editor
      node_palette: 'Node Palette',
      drag_nodes_instruction: 'Drag elements onto the canvas to create your flowchart',
      tips: 'Tips',
      tip_drag_nodes: 'Drag elements from the palette to the canvas',
      tip_connect_nodes: 'Click and drag from node handles to create connections',
      tip_select_multiple: 'Hold Shift to select multiple elements',
      tip_delete_selection: 'Press Delete key to remove selected elements',
      flowchart: 'Flowchart',
      label: 'Label',
      task_id: 'Task ID',
      enter_task_id: 'Enter Task ID',
      task_id_description: 'ID of the task from Hapa Task Manager',
      
      // Consul Integration
      my_consuls: 'My Consuls',
      all_consuls: 'All Consuls',
      consul_flowcharts: 'Consul Flowcharts',
      join_consul: 'Join Consul',
      create_consul: 'Create Consul',
      back_to_consuls: 'Back to Consuls',
      workspaces: 'Workspaces',
      consul_not_found: 'Consul not found',
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