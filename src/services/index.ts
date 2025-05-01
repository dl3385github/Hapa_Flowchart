import webRTCService from './WebRTCService';
import hyperswarmWebRTCService from './HyperswarmWebRTCService';
import yjsService from './YjsService';

// Choose which WebRTC service to use - we now use Hyperswarm for real P2P discovery
const activeWebRTCService = hyperswarmWebRTCService;

// Initialize services when this file is imported
const initializeServices = async () => {
  try {
    console.log('Initializing services...');
    await activeWebRTCService.initialize();
    // YjsService will be initialized when a document is opened
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
};

// Initialize in background without blocking
initializeServices();

// Export the active WebRTC service as webRTCService for backward compatibility
export { 
  activeWebRTCService as webRTCService,
  yjsService
}; 