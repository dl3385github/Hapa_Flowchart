import webRTCService from './WebRTCService';
import yjsService from './YjsService';
import p2pService from './P2PService';

// Initialize services when this file is imported
const initializeServices = async () => {
  try {
    console.log('Initializing services...');
    
    // Initialize P2P service first
    await p2pService.initialize();
    
    // For backward compatibility
    await webRTCService.initialize();
    
    // YjsService will be initialized when a document is opened
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
};

// Initialize in background without blocking
initializeServices();

export { 
  webRTCService,
  yjsService,
  p2pService
}; 