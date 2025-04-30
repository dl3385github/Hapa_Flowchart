import webRTCService from './WebRTCService';

// Initialize services when this file is imported
const initializeServices = async () => {
  try {
    console.log('Initializing services...');
    await webRTCService.initialize();
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
};

// Initialize in background without blocking
initializeServices();

export { webRTCService }; 