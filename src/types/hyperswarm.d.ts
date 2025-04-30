declare module 'hyperswarm' {
  import { EventEmitter } from 'events';
  import { Duplex } from 'stream';

  interface ConnectionInfo {
    publicKey: Buffer;
    type: 'tcp' | 'utp';
    client: boolean;
    peer: {
      host: string;
      port: number;
    };
  }

  interface SwarmOptions {
    keyPair?: {
      publicKey: Buffer;
      secretKey: Buffer;
    };
    seed?: Buffer;
    maxPeers?: number;
    firewall?: (remotePublicKey: Buffer) => boolean;
    dht?: any;
  }

  interface DiscoveryOptions {
    server?: boolean;
    client?: boolean;
  }

  interface PeerDiscovery {
    flushed(): Promise<void>;
    refresh(opts: DiscoveryOptions): Promise<void>;
    destroy(): Promise<void>;
  }

  class Hyperswarm extends EventEmitter {
    constructor(opts?: SwarmOptions);

    on(event: 'connection', listener: (conn: Duplex, info: ConnectionInfo) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    connections: Set<Duplex>;
    peers: Map<string, any>;
    connecting: number;

    join(topic: Buffer, opts?: DiscoveryOptions): PeerDiscovery;
    leave(topic: Buffer): Promise<void>;
    joinPeer(noisePublicKey: Buffer): void;
    leavePeer(noisePublicKey: Buffer): void;
    status(topic: Buffer): PeerDiscovery | null;
    listen(): Promise<void>;
    flush(): Promise<void>;
    destroy(): Promise<void>;
  }

  export default Hyperswarm;
} 