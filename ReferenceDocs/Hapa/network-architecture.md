# Hapa.ai Network Architecture

## Overview

The Hapa.ai network is built on a hybrid-decentralized architecture that combines the benefits of peer-to-peer (P2P) protocols with structured organization and discovery mechanisms. This architecture enables secure, resilient, and scalable communications, data storage, and AI inference across a distributed network of user nodes, all while maintaining privacy and user sovereignty.

## Core Components

### 1. Node Architecture

Each user in the Hapa network operates a node that consists of several key components:

- **Hypercore Client**: Manages P2P communication and data replication
- **AT Protocol Client**: Interfaces with the Bluesky network via pds.hapa.ai
- **Local AI Engine**: Runs the user's Gatekeeper and other AI functionalities
- **Distributed Storage**: Manages data sharing and persistence
- **User Interface**: Electron-based desktop application interface

### 2. Identity and Discovery

- **Decentralized Identifiers (DIDs)**: Each user has a unique DID for secure identification
- **Hyperswarm**: Used for peer discovery and NAT traversal
- **Node Directory**: Optional discovery service for finding specific nodes
- **AT Protocol Integration**: Additional identity and social graph through Bluesky

### 3. Communication Protocols

- **Direct P2P**: WebRTC-based communication for real-time audio/video/data
- **Hypercore Feeds**: Append-only logs for reliable message delivery
- **Encrypted Channels**: End-to-end encrypted messaging between peers
- **AT Protocol**: Integration with Bluesky for wider social networking

### 4. Data Storage

- **Local-First**: Primary data storage on the user's own device
- **HyperDHT**: Distributed hash table for peer discovery and routing
- **Hyperdrive**: Secure, versioned, P2P filesystem for document storage
- **Corestore**: Managing multiple Hypercore feeds for different data types
- **Replication**: Selective data replication for resilience and availability

## Network Topology

### Peer Relationships

- **Direct Connections**: Peers can connect directly for communication
- **Friend Network**: Trusted connections with mutual authentication
- **Consuls**: Specialized three-node clusters with enhanced data sharing
- **Discovery Network**: Lightweight connections for node discovery
- **Gateway Nodes**: Optional super-nodes to assist with discovery and NAT traversal

### State Management

- **Local State**: Application state managed locally on each device
- **Shared State**: Selective state synchronization between peers
- **Consul State**: Enhanced state sharing within Consul groups
- **Network State**: Minimal global state for discovery and directory services

## Protocol Stack

### Networking Layer

- **WebRTC**: For direct peer-to-peer data, audio, and video channels
- **UDP and TCP**: Underlying transport protocols for WebRTC and Hyperswarm
- **NAT Traversal**: ICE, STUN, and TURN for connectivity through firewalls
- **Connection Security**: TLS and DTLS for secure connections

### Data Layer

- **Hypercore Protocol**: Core data structures for append-only logs
- **Hyperdrive**: File system abstraction on top of Hypercore
- **SLEEP Format**: Storage format for Hypercore data
- **Merkle Trees**: For data integrity verification
- **DAG Syncing**: Directed Acyclic Graph synchronization between peers

### Application Layer

- **Messaging Protocol**: Format and rules for peer-to-peer text messaging
- **Video Call Protocol**: Signaling and media exchange for video calls
- **File Sharing Protocol**: Rules for exchanging and replicating files
- **AI Inference Protocol**: Interface for distributed AI operations
- **Gatekeeper Protocol**: Rules for Gatekeeper-to-Gatekeeper communication

## Security Model

### Encryption and Authentication

- **End-to-End Encryption**: All peer-to-peer communication is encrypted
- **Asymmetric Cryptography**: Ed25519 keys for node identity and signatures
- **Key Exchange**: Secure key exchange for encrypted channels
- **Authentication**: Mutual authentication of peers before connection

### Privacy Protection

- **Local Data Storage**: Minimizes data exposure to third parties
- **Selective Disclosure**: User control over what data is shared
- **Metadata Protection**: Minimizes leakage of communication metadata
- **Gatekeeper Filtering**: AI assistance in managing communications

### Threat Mitigation

- **Sybil Attack Protection**: Mechanisms to prevent fake identity attacks
- **Eclipse Attack Protection**: Diverse peer connections to prevent isolation
- **DoS Protection**: Rate limiting and resource allocation controls
- **Reputation Systems**: Tracking of peer reliability and behavior

## Bluesky Integration

### Architecture

- **PDS Connection**: Custom PDS (pds.hapa.ai) for Bluesky integration
- **AT Protocol Client**: Implementation of the AT Protocol for Bluesky communication
- **Identity Bridging**: Mapping between Hapa DIDs and Bluesky handles
- **Feed Integration**: Bluesky content appearing in Hapa interface
- **Content Federation**: Selective sharing of Hapa content to Bluesky

### Features

- **Cross-Platform Messaging**: Communication with Bluesky users
- **Social Graph Extension**: Access to wider social connections
- **Content Discovery**: Finding relevant content and connections
- **Identity Verification**: Additional identity verification via Bluesky

## Implementation Status

The current implementation includes:
- Basic Hypercore-based P2P messaging
- WebRTC video calling with transcription
- Initial AT Protocol integration via pds.hapa.ai
- Foundation for Hyperswarm-based peer discovery
- P2P connection management and message exchange
- Basic encryption and security implementations

## Next Steps in Network Development

- Complete implementation of HyperDHT integration
- Develop Hyperdrive storage for file sharing
- Enhance security with formal encryption protocols
- Implement full Gatekeeper-to-Gatekeeper communication
- Expand AT Protocol integration capabilities
- Develop NAT traversal improvements for reliable connectivity
- Create distributed AI inference scheduling system
- Build token-based incentives for network participation 