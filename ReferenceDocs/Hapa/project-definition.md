# Hapa.ai Project Definition

## Overview

Hapa.ai is a decentralized peer-to-peer network designed to connect both AI and humans in a privacy-focused ecosystem. Built on the Hypercore protocol and integrated with the AT Protocol (Bluesky), Hapa creates a hybrid-decentralized architecture that enables secure communications, distributed AI inference, and decentralized data storage. The platform is powered by a crypto-economic system that incentivizes contribution and governance.

## Core Concepts

### Gatekeeper

Each user in the Hapa network is represented by a "Gatekeeper" - a personalized AI assistant that:
- Acts as a proxy for the user, mimicking their behavior and preferences
- Screens incoming communication requests from strangers
- Makes insignificant decisions on behalf of the user
- Learns from the user's interactions to better represent them
- Facilitates safe introduction between users by conversing with other Gatekeepers

### Consul

A Consul is a collaborative unit consisting of 3 connected peers that:
- Makes collective decisions through a voting mechanism
- Works together on shared projects with distributed responsibility
- Manages shared file storage through P2P connections
- Forms a collective AI identity through the combination of member Gatekeepers
- Communicates through built-in P2P video calls with transcription and summarization
- Creates and assigns tasks through consensus voting

### Crypto System

The Hapa economy is powered by three primary tokens:
1. **Don**: Storage-based cryptocurrency minted when files are shared to the network
2. **Rose**: Used for AI inference operations on the distributed compute system
3. **Bananas**: The general utility token purchased or sold for access to network capabilities

### Network Architecture

- **P2P Core**: Built on the Hypercore protocol for direct peer connections
- **Decentralized Identifiers (DIDs)**: Each user has a unique DID for secure identification
- **Hyperswarm**: Used for peer discovery and connection
- **Distributed Storage**: Leveraging HyperDHT or Hyperdrive for file storage
- **Bluesky Integration**: Connected to the AT Protocol through pds.hapa.ai

### AI Infrastructure

- **Local First**: AI models run locally on the user's device for privacy and security
- **Modular Design**: Users can swap out AI models at any time
- **Trusted Computing**: Since AI runs locally, users can safely share personal data
- **Distributed Inference**: Complex AI workloads can be distributed across the network

## Key Features

### Social Networking
- Friend requests with Gatekeeper-based screening
- P2P text messaging
- Decentralized social feed integrated with Bluesky
- Privacy-first connections facilitated by AI

### Collaboration Tools
- P2P video calling with WebRTC
- Real-time transcription using OpenAI Whisper
- Meeting summarization capabilities
- Task creation and consensus voting
- Shared workspace for Consuls

### Governance and Economics
- Token-based incentive system
- Democratic decision-making through Consuls
- Modular open-source structure allowing for compensation of contributors
- Marketplace for custom modules with revenue sharing

## Technical Implementation

- **Electron Application**: Cross-platform desktop client
- **Hypercore Protocol**: Core P2P protocol for networking
- **Local LLM Integration**: Support for running AI models locally
- **AT Protocol Client**: Integration with Bluesky network
- **OpenAI Whisper**: Speech transcription for video calls
- **WebRTC**: For peer-to-peer audio/video communication

## Open Source Ecosystem

- Modular architecture allows anyone to contribute
- Contributors can be compensated through the crypto system
- Module marketplace for customization and extension
- Transparent governance and decision-making

## Current State

The application currently has implemented:
- Basic P2P messaging using Hypercore
- WebRTC video calling with multiple participants
- Real-time transcription using OpenAI Whisper
- AT Protocol integration for Bluesky connectivity
- Task creation and voting mechanism for Consuls
- Basic UI framework for Gatekeeper interaction

## Next Steps

- Implement full Gatekeeper AI functionality
- Develop the crypto token system (Don, Rose, Bananas)
- Create the Consul collective intelligence system
- Build distributed file storage mechanisms
- Expand AT Protocol integration
- Develop the module marketplace 