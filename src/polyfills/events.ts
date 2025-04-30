// Simple EventEmitter polyfill for the browser
export class EventEmitter {
  private events: Record<string, Array<(...args: any[]) => void>> = {};
  
  constructor() {
    this.events = {};
  }
  
  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(listener);
    return this;
  }
  
  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }
    
    this.events[event].forEach(listener => {
      listener(...args);
    });
    
    return true;
  }
  
  removeListener(event: string, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      return this;
    }
    
    this.events[event] = this.events[event].filter(l => l !== listener);
    return this;
  }
  
  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    
    return this;
  }
  
  once(event: string, listener: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.removeListener(event, onceWrapper);
    };
    
    return this.on(event, onceWrapper);
  }
}

export default {
  EventEmitter
}; 