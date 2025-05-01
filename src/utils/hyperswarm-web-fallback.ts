import { EventEmitter } from 'events';
import { Duplex } from 'stream';

// Create a mock implementation of hyperswarm-web that can be used as a fallback
// when the real module fails to initialize due to browser compatibility issues

class MockDuplex extends EventEmitter {
  constructor() {
    super();
    // @ts-ignore
    this.destroyed = false;
  }

  write(data: any): boolean {
    console.log('MockDuplex write called but not implemented');
    return true;
  }

  destroy() {
    // @ts-ignore
    this.destroyed = true;
    this.emit('close');
  }
}

class HyperswarmWebFallback extends EventEmitter {
  private topics: Map<string, { announce: boolean; lookup: boolean }> = new Map();
  
  constructor(options?: any) {
    super();
    console.warn('Using HyperswarmWebFallback implementation - real P2P functionality is limited');
  }
  
  join(topic: Buffer, options: { announce?: boolean, lookup?: boolean } = {}): any {
    const topicKey = topic.toString('hex');
    this.topics.set(topicKey, { 
      announce: options.announce !== false, 
      lookup: options.lookup !== false 
    });
    console.log(`Joined topic: ${topicKey}`);
    return { topic };
  }
  
  async leave(topic: Buffer): Promise<void> {
    const topicKey = topic.toString('hex');
    this.topics.delete(topicKey);
    console.log(`Left topic: ${topicKey}`);
  }
  
  // Mock a connection for testing
  mockConnection() {
    const stream = new MockDuplex();
    const info = {
      type: 'webrtc',
      client: false,
      peer: {
        host: '127.0.0.1',
        port: 8000
      },
      publicKey: Buffer.from('mock-public-key'),
      topics: Array.from(this.topics.keys()).map(t => Buffer.from(t, 'hex'))
    };
    
    this.emit('connection', stream, info);
    return { stream, info };
  }
  
  async destroy(): Promise<void> {
    this.topics.clear();
    this.removeAllListeners();
    console.log('HyperswarmWebFallback destroyed');
  }
}

// Factory function to match the original hyperswarm-web API
function createHyperswarmWebFallback(options?: any): HyperswarmWebFallback {
  return new HyperswarmWebFallback(options);
}

export default createHyperswarmWebFallback; 