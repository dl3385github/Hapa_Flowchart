declare module '../polyfills/bare-hyperswarm' {
  export class Hyperswarm {
    constructor(opts?: any);
    
    topics: Map<string, any>;
    peers: Set<any>;
    eventHandlers: {
      connection: Function[];
      disconnection: Function[];
      error: Function[];
    };
    
    join(topic: Uint8Array, opts?: any): any;
    leave(topic: Uint8Array): void;
    on(event: string, callback: Function): void;
    once(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    emit(event: string, ...args: any[]): void;
    simulateConnection(connection: any, info: any): void;
    simulateDisconnection(connection: any, info: any): void;
    destroy(): Promise<void>;
  }
  
  export class DHT {
    constructor(opts?: any);
    lookup(key: Uint8Array): Promise<any[]>;
    bootstrap(nodes?: string[]): Promise<void>;
    destroy(): Promise<void>;
  }
} 