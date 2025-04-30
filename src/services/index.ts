import webRTCService from './WebRTCService';
import yjsService from './YjsService';

// Initialize services when this file is imported
const initializeServices = async () => {
  try {
    console.log('Initializing services...');
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
  yjsService
}; 