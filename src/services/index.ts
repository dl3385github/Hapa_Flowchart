import yjsService from './YjsService';
import p2pService from './P2PService';

// Initialize services when this file is imported
const initializeServices = async () => {
  try {
    console.log('Initializing services...');
    await p2pService.initialize();
    // YjsService will be initialized when a document is opened
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
};

// Initialize in background without blocking
initializeServices();

// Export services
export { 
  p2pService,
  yjsService
}; 