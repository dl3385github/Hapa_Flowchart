declare module 'hyperswarm-web' {
  import { EventEmitter } from 'events';
  import { Duplex } from 'stream';

  interface HyperswarmWebOptions {
    bootstrap?: string[];
    wsProxy?: string[];
    webrtcBootstrap?: string[];
    maxPeers?: number;
    wsReconnectDelay?: number;
    simplePeer?: {
      config?: {
        iceServers?: Array<{
          urls: string | string[];
          username?: string;
          credential?: string;
        }>;
      };
      [key: string]: any;
    };
  }

  interface ConnectionInfo {
    type: string;
    client: boolean;
    peer: {
      host: string;
      port: number;
    };
    publicKey?: Buffer;
    topics?: Buffer[];
  }

  class HyperswarmWeb extends EventEmitter {
    constructor(options?: HyperswarmWebOptions);
    
    join(topic: Buffer, options?: { announce?: boolean, lookup?: boolean }): any;
    leave(topic: Buffer): Promise<void>;
    
    connections: Set<Duplex>;
    peers: any[];
    
    destroy(): Promise<void>;
    
    on(event: 'connection', listener: (socket: Duplex, info: ConnectionInfo) => void): this;
    on(event: 'disconnection', listener: (socket: Duplex, info: ConnectionInfo) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  function hyperswarmWeb(options?: HyperswarmWebOptions): HyperswarmWeb;

  export = hyperswarmWeb;
} 