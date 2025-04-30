import { EventEmitter } from 'events';

// Simple Duplex stream polyfill for the browser
export class Duplex extends EventEmitter {
  writable: boolean = true;
  readable: boolean = true;
  
  constructor() {
    super();
  }
  
  write(chunk: string | Buffer): boolean {
    return true;
  }
  
  end(data?: string | Buffer): void {
    this.emit('end');
    this.writable = false;
    this.readable = false;
  }
  
  pipe<T extends NodeJS.WritableStream>(destination: T): T {
    return destination;
  }
}

export default {
  Duplex
}; 