import fallbackImplementation from './hyperswarm-web-fallback';

// Factory function that tries to load the real hyperswarm-web first,
// but falls back to our mock implementation if that fails
const getHyperswarmWeb = () => {
  try {
    // First try to load the actual module
    const hyperswarmWeb = require('hyperswarm-web');
    console.log('Using real hyperswarm-web module');
    return hyperswarmWeb;
  } catch (error) {
    // If that fails, use our fallback implementation
    console.warn('Failed to load hyperswarm-web, using fallback implementation:', error);
    return fallbackImplementation;
  }
};

// Create a singleton instance of the factory
const hyperswarmWebFactory = getHyperswarmWeb();

export default hyperswarmWebFactory; 