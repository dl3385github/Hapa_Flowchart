# Flowchart Collaboration Network Architecture

## Overview

The flowchart collaboration feature uses a peer-to-peer (P2P) architecture built on Hypercore and WebRTC to enable real-time collaboration between users. This architecture ensures secure, resilient, and scalable communication while maintaining data integrity and synchronization.

## Core Components

### 1. Node Architecture

Each user in the collaboration network operates a node that consists of:

- **Hypercore Client**: Manages P2P communication and data replication
- **WebRTC Service**: Handles real-time data exchange between peers
- **Hyperswarm DHT**: Facilitates peer discovery and NAT traversal
- **Local Storage**: Manages flowchart data persistence
- **User Interface**: React-based web application interface

### 2. Identity and Discovery

- **Flowchart Keys**: Each flowchart has a unique key for identification
- **Hyperswarm DHT**: Used for peer discovery and NAT traversal
- **Discovery Keys**: SHA-256 hashes derived from flowchart keys for peer discovery
- **Peer Directory**: Maintains active peer connections

### 3. Communication Protocols

- **Direct P2P**: WebRTC-based communication for real-time data
- **Hypercore Feeds**: Append-only logs for reliable message delivery
- **Encrypted Channels**: End-to-end encrypted messaging between peers
- **State Synchronization**: Real-time state updates between peers with version control
- **Connection Health**: Ping/pong mechanism for connection monitoring

### 4. Data Storage

- **Local-First**: Primary data storage on the user's own device
- **Hypercore**: Secure, versioned storage for flowchart data
- **Replication**: Selective data replication for resilience
- **Conflict Resolution**: Automatic conflict resolution for concurrent edits

## Network Topology

### Peer Relationships

- **Direct Connections**: Peers connect directly for real-time collaboration
- **Discovery Network**: Lightweight connections for peer discovery
- **Gateway Nodes**: Optional super-nodes to assist with NAT traversal
- **Connection Health**: Automatic monitoring and recovery of peer connections

### State Management

- **Local State**: Application state managed locally on each device
- **Shared State**: Real-time state synchronization between peers
- **Version Control**: State versioning for consistency and conflict resolution
- **State Types**: Different state types (flowchart, cursor, awareness) with type-specific handling
- **State Acknowledgment**: Peers acknowledge state updates to ensure consistency

## Protocol Stack

### Networking Layer

- **WebRTC**: For direct peer-to-peer data channels
- **UDP and TCP**: Underlying transport protocols
- **NAT Traversal**: ICE, STUN, and TURN for connectivity
- **Connection Security**: TLS and DTLS for secure connections
- **Connection Monitoring**: Ping/pong for connection health tracking

### Data Layer

- **Hypercore Protocol**: Core data structures for append-only logs
- **SLEEP Format**: Storage format for Hypercore data
- **Merkle Trees**: For data integrity verification
- **DAG Syncing**: Directed Acyclic Graph synchronization
- **State Versioning**: Version control for state updates

### Application Layer

- **Flowchart Protocol**: Format and rules for flowchart data
- **Collaboration Protocol**: Rules for real-time collaboration
- **State Sync Protocol**: Version-based state synchronization
- **Conflict Resolution Protocol**: Rules for resolving conflicts
- **Connection Health Protocol**: Rules for monitoring and maintaining connections

## Security Model

### Encryption and Authentication

- **End-to-End Encryption**: All peer-to-peer communication is encrypted
- **Asymmetric Cryptography**: Ed25519 keys for node identity
- **Key Exchange**: Secure key exchange for encrypted channels
- **Authentication**: Mutual authentication of peers

### Privacy Protection

- **Local Data Storage**: Minimizes data exposure
- **Selective Disclosure**: User control over shared data
- **Metadata Protection**: Minimizes communication metadata
- **Access Control**: Permission-based access to flowcharts

### Threat Mitigation

- **Sybil Attack Protection**: Prevention of fake identity attacks
- **Eclipse Attack Protection**: Diverse peer connections
- **DoS Protection**: Rate limiting and resource controls
- **Integrity Verification**: Data integrity checks

## Implementation Details

### Current Implementation

- **Hypercore Integration**: Using Hypercore for data storage and replication
- **WebRTC Service**: Real-time data exchange between peers
- **Hyperswarm DHT**: Peer discovery and NAT traversal
- **State Management**: Version-based state synchronization
- **Conflict Resolution**: Automatic conflict resolution
- **Connection Health**: Ping/pong mechanism for monitoring connections
- **Reconnection Logic**: Automatic reconnection with exponential backoff

### Key Features

- **Real-time Collaboration**: Multiple users can edit simultaneously
- **Offline Support**: Local-first architecture with sync on reconnect
- **Version History**: Track changes and revert if needed
- **Secure Communication**: End-to-end encrypted data exchange
- **NAT Traversal**: Automatic peer discovery and connection
- **Connection Resilience**: Automatic monitoring and recovery of connections
- **State Consistency**: Version-based state synchronization with acknowledgments

## Next Steps

- Enhance NAT traversal reliability
- Implement more robust conflict resolution
- Add support for larger flowcharts
- Improve offline capabilities
- Add real-time presence indicators
- Implement change tracking and history
- Add support for file attachments
- Enhance security with formal encryption protocols
- Improve connection monitoring and recovery mechanisms
- Add support for connection quality metrics and analytics
- Implement state rollback for failed updates
- Add support for selective state synchronization
- Implement state compression for large updates
- Add support for state migration between versions 