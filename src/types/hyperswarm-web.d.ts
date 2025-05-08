declare module 'hyperswarm-web' {
  import { EventEmitter } from 'events';
  import SimplePeer from 'simple-peer';

  interface HyperswarmWebOptions {
    bootstrap?: string[];
    simplePeer?: {
      config?: RTCConfiguration;
      [key: string]: any;
    };
    maxPeers?: number;
    wsReconnectDelay?: number;
  }

  interface DiscoveryOptions {
    announce?: boolean;
    lookup?: boolean;
  }

  interface PeerInfo {
    id?: string;
    [key: string]: any;
  }

  interface PeerDetails {
    peer?: PeerInfo;
    type?: string;
    client?: boolean;
    [key: string]: any;
  }

  class HyperswarmWeb extends EventEmitter {
    constructor(opts?: HyperswarmWebOptions);

    on(event: 'connection', listener: (socket: SimplePeer.Instance, info: PeerDetails) => void): this;
    on(event: 'disconnection', listener: (socket: SimplePeer.Instance, info: PeerDetails) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    join(topic: Uint8Array, opts?: DiscoveryOptions): any;
    leave(discovery: any): Promise<void>;
    connections: Map<string, SimplePeer.Instance>;
    destroy(): Promise<void>;
  }

  function hyperswarmWeb(opts?: HyperswarmWebOptions): HyperswarmWeb;
  
  export = hyperswarmWeb;
} 