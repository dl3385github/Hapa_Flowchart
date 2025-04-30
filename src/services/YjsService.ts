import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { store } from '../store';
import { 
  setCollaborativeDocument, 
  setLocalAwareness,
  updatePeer
} from '../store/slices/collaborationSlice';
import webRTCService from './WebRTCService';

interface UserInfo {
  id: string;
  name: string;
  color: string;
}

interface AwarenessState {
  user: UserInfo;
  cursor: { x: number; y: number } | null;
}

interface YjsProviderOptions {
  signaling: string[];
  password: string | null;
  awareness: any;
  maxConns: number;
  filterBcConns: boolean;
  peerOpts: Record<string, any>;
}

class YjsService {
  private ydoc: Y.Doc | null = null;
  private provider: WebrtcProvider | null = null;
  private indexeddbProvider: IndexeddbPersistence | null = null;
  private flowchartData: Y.Map<any> | null = null;
  private nodesData: Y.Array<any> | null = null;
  private edgesData: Y.Array<any> | null = null;
  private awareness: any | null = null;
  private documentId: string | null = null;

  // Initialize the Yjs document with a given ID
  public async initialize(documentId: string): Promise<void> {
    if (this.ydoc && this.documentId === documentId) {
      // Already initialized with this document
      return;
    }

    // Clean up previous document if any
    this.cleanup();

    try {
      this.documentId = documentId;

      // Create a new Yjs document
      this.ydoc = new Y.Doc();

      // Initialize data structures
      this.flowchartData = this.ydoc.getMap('flowchart');
      this.nodesData = this.ydoc.getArray('nodes');
      this.edgesData = this.ydoc.getArray('edges');

      // Set up the WebRTC provider for real-time collaboration
      // Use the documentId as the room name to ensure unique rooms for each flowchart
      const roomName = `hapa-flowchart-${documentId}`;
      const webrtcOptions: YjsProviderOptions = {
        signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'],
        password: null, // Consider using a derived password for better security
        awareness: null,
        maxConns: 20,
        filterBcConns: true,
        peerOpts: {}
      };

      console.log(`Initializing WebRTC provider with room: ${roomName}`);
      this.provider = new WebrtcProvider(roomName, this.ydoc, webrtcOptions as any);
      this.awareness = this.provider.awareness;

      // Set up local awareness (cursor position, user info)
      const localPeerId = webRTCService.getLocalPeerId() || 'unknown';
      this.awareness.setLocalState({
        user: {
          id: localPeerId,
          name: 'User ' + localPeerId.substring(0, 6),
          color: this.getRandomColor()
        },
        cursor: null
      });

      // Set up persistence with IndexedDB
      this.indexeddbProvider = new IndexeddbPersistence(`hapa-flowchart-${documentId}`, this.ydoc);

      // Subscribe to changes
      this.subscribeToChanges();

      // Store the document in the Redux store
      store.dispatch(setCollaborativeDocument({
        documentId,
        doc: this.ydoc
      }));

      // Update local awareness in Redux
      const localState = this.awareness.getLocalState();
      store.dispatch(setLocalAwareness({
        user: localState?.user || null,
        cursor: localState?.cursor || null
      }));

      console.log('Yjs initialized with document ID:', documentId);
    } catch (error) {
      console.error('Failed to initialize Yjs:', error);
      this.cleanup();
      throw error;
    }
  }

  // Subscribe to changes in the Yjs document
  private subscribeToChanges(): void {
    if (!this.ydoc || !this.awareness) return;

    // Listen for flowchart data changes
    this.flowchartData?.observe(event => {
      console.log('Flowchart data changed:', event);
      this.notifyFlowchartUpdated();
    });

    // Listen for node changes
    this.nodesData?.observe(event => {
      console.log('Nodes data changed:', event);
      this.notifyFlowchartUpdated();
    });

    // Listen for edge changes
    this.edgesData?.observe(event => {
      console.log('Edges data changed:', event);
      this.notifyFlowchartUpdated();
    });

    // Listen for awareness changes (cursor positions, user info)
    this.awareness.on('change', () => {
      this.handleAwarenessChange();
    });

    // Listen for connection status changes
    if (this.provider) {
      this.provider.on('status', ({ connected }: { connected: boolean }) => {
        console.log('WebRTC connection status changed:', connected);
      });
    }
  }

  // Handle awareness changes (e.g., cursor positions)
  private handleAwarenessChange(): void {
    // Handle awareness changes
    if (!this.awareness) return;
    
    // Extract the states of all users
    const states = this.awareness.getStates();
    
    if (states) {
      // Update peers in the Redux store based on awareness states
      states.forEach((state: AwarenessState, clientId: number) => {
        if (state && state.user && clientId !== this.awareness?.clientID) {
          const user = state.user;
          // Update peer information in store directly
          store.dispatch(updatePeer({
            peerId: user.id,
            info: {
              name: user.name,
              color: user.color,
              cursor: state.cursor || undefined,
              peerId: user.id
            }
          }));
          
          // Also update via WebRTC service
          webRTCService.updatePeerFromAwareness(user.id, {
            name: user.name,
            color: user.color,
            cursor: state.cursor || undefined
          });
        }
      });
    }
  }

  // Notify that the flowchart has been updated
  private notifyFlowchartUpdated(): void {
    // This would dispatch an action to update the flowchart in the Redux store
    // or trigger a callback to update the UI
    if (this.flowchartChangedCallback) {
      this.flowchartChangedCallback();
    }
  }

  // Callback for flowchart changes
  private flowchartChangedCallback: (() => void) | null = null;

  // Set callback for flowchart changes
  public onFlowchartChanged(callback: () => void): void {
    this.flowchartChangedCallback = callback;
  }

  // Update cursor position
  public updateCursorPosition(x: number, y: number): void {
    if (!this.awareness) return;

    const state = this.awareness.getLocalState();
    if (state) {
      state.cursor = { x, y };
      this.awareness.setLocalState(state);
      
      // Also update WebRTC service
      webRTCService.sendCursorPosition(x, y);
    }
  }

  // Update flowchart data
  public updateFlowchart(data: any): void {
    if (!this.flowchartData) return;

    // Apply changes to the Yjs data structures
    this.ydoc?.transact(() => {
      // Update general flowchart properties
      if (data.properties) {
        Object.entries(data.properties).forEach(([key, value]) => {
          this.flowchartData?.set(key, value);
        });
      }

      // Update nodes
      if (data.nodes) {
        this.nodesData?.delete(0, this.nodesData.length);
        data.nodes.forEach((node: any) => {
          this.nodesData?.push([node]);
        });
      }

      // Update edges
      if (data.edges) {
        this.edgesData?.delete(0, this.edgesData.length);
        data.edges.forEach((edge: any) => {
          this.edgesData?.push([edge]);
        });
      }
    });

    // Also update through WebRTC for redundancy
    webRTCService.sendFlowchartUpdate(data);
  }

  // Get the current flowchart data
  public getFlowchartData(): any {
    if (!this.flowchartData || !this.nodesData || !this.edgesData) {
      return null;
    }

    return {
      properties: this.flowchartData.toJSON(),
      nodes: this.nodesData.toArray(),
      edges: this.edgesData.toArray()
    };
  }

  // Generate a random color for user identification
  private getRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA5A5',
      '#A5FFD6', '#A5C8FF', '#FFA5E0', '#DEFF79'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Clean up Yjs resources
  public cleanup(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }

    if (this.indexeddbProvider) {
      this.indexeddbProvider.destroy();
      this.indexeddbProvider = null;
    }

    if (this.ydoc) {
      this.ydoc.destroy();
      this.ydoc = null;
    }

    this.flowchartData = null;
    this.nodesData = null;
    this.edgesData = null;
    this.awareness = null;
    this.documentId = null;
    this.flowchartChangedCallback = null;
  }
}

// Export as a singleton
const yjsService = new YjsService();
export default yjsService; 