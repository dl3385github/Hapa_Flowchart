// Core Types for Hapa Flowchart

import { Node, Edge, NodeChange, EdgeChange } from 'reactflow';

// Flowchart data structure
export interface Flowchart {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // DID of creator
  version: number;
  public: boolean;
  nodes: Node[];
  edges: Edge[];
  metadata?: FlowchartMetadata;
}

// Additional metadata for flowcharts
export interface FlowchartMetadata {
  tags?: string[];
  consulId?: string;
  cryptoMetadata?: {
    rewards: number;
    staked: number;
  };
}

// User permissions
export type UserRole = 'owner' | 'editor' | 'viewer';

export interface Permission {
  did: string;
  role: UserRole;
  grantedAt: string;
  grantedBy?: string;
}

// Task integration
export interface LinkedTask {
  taskId: string;
  nodeId: string;
  linkedAt: string;
}

// Version history entry
export interface Version {
  version: number;
  timestamp: string;
  author?: string;
  message?: string;
  changes: {
    nodesAdded: string[];
    nodesRemoved: string[];
    nodesModified: string[];
    edgesAdded: string[];
    edgesRemoved: string[];
    edgesModified: string[];
  };
}

// Combined changes for reactflow
export interface FlowChanges {
  nodeChanges: NodeChange[];
  edgeChanges: EdgeChange[];
}

// User info for collaboration
export interface CollaboratorInfo {
  did?: string;
  peerId: string;
  name?: string;
  cursor?: {
    x: number;
    y: number;
  };
  lastSeen: string;
}

// Task data from Hapa Task Manager
export interface HapaTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  assignees: string[]; // DIDs
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

// Application settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autosave: boolean;
  autoLayout: boolean;
  snapToGrid: boolean;
  gridSize: number;
  language: string;
}

// UI state
export interface UIState {
  sidebarOpen: boolean;
  propertyPanelOpen: boolean;
  activePanel: string | null;
  selectedElements: {
    nodes: string[];
    edges: string[];
  };
} 