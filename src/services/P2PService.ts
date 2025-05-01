import webRTCService from './WebRTCService';
import hyperswarmWebRTCService from './HyperswarmWebRTCService';

// Use the fully decentralized Hyperswarm implementation by default
const USE_HYPERSWARM = true;

class P2PService {
  private service: typeof webRTCService | typeof hyperswarmWebRTCService;
  
  constructor() {
    // Use either the old WebRTCService or the new HyperswarmWebRTCService
    this.service = USE_HYPERSWARM ? hyperswarmWebRTCService : webRTCService;
  }
  
  // Initialize the service
  public async initialize(): Promise<string> {
    return this.service.initialize();
  }
  
  // Get the local peer ID
  public getLocalPeerId(): string | null {
    return this.service.getLocalPeerId();
  }
  
  // Set local user information
  public setLocalUserInfo(userInfo: any): void {
    this.service.setLocalUserInfo(userInfo);
  }
  
  // Register callback for flowchart updates
  public onFlowchartUpdate(callback: (data: any) => void): void {
    this.service.onFlowchartUpdate(callback);
  }
  
  // Create and share a flowchart
  public async createSharedFlowchart(flowchartId: string): Promise<string> {
    return this.service.createSharedFlowchart(flowchartId);
  }
  
  // Get the key for a flowchart
  public getFlowchartKey(flowchartId: string): string | null {
    return this.service.getFlowchartKey(flowchartId);
  }
  
  // Join an existing shared flowchart
  public async joinSharedFlowchart(hypercoreKey: string): Promise<boolean> {
    return this.service.joinSharedFlowchart(hypercoreKey);
  }
  
  // Send a flowchart update
  public sendFlowchartUpdate(flowchartData: any): void {
    this.service.sendFlowchartUpdate(flowchartData);
  }
  
  // Send cursor position
  public sendCursorPosition(x: number, y: number): void {
    this.service.sendCursorPosition(x, y);
  }
  
  // Clean up
  public async cleanup(): Promise<void> {
    return this.service.cleanup();
  }
}

// Create a singleton instance
const p2pService = new P2PService();

export default p2pService; 