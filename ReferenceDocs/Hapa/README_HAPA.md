# Hapa.ai Documentation

## Project Overview

Hapa.ai is a decentralized peer-to-peer network designed to connect both AI and humans in a privacy-focused ecosystem. Built on the Hypercore protocol and integrated with the AT Protocol (Bluesky), it creates a new paradigm for digital interaction where AI and humans can collaborate, communicate, and create value together.

## Documentation Structure

This repository contains comprehensive documentation for the Hapa.ai project, broken down into specific areas of functionality and design:

- [Project Definition](project-definition.md): High-level overview of the entire Hapa.ai concept
- [Gatekeeper System](gatekeeper.md): Details on the personalized AI assistant system
- [Consul System](consul.md): Information about collaborative three-person teams
- [Crypto-Economic System](crypto-system.md): Documentation on the token ecosystem (Don, Rose, Bananas)
- [Network Architecture](network-architecture.md): Technical details of the P2P network infrastructure
- [AI Infrastructure](ai-infrastructure.md): Explanation of the AI technologies and implementation
- [Open Source Ecosystem](open-source-ecosystem.md): Details on the modular, community-driven development approach
- [Technical Implementation](technical-implementation.md): Current status of the codebase and development roadmap

## Core Concepts

### Gatekeeper

Each user in the Hapa network is represented by a "Gatekeeper" - a personalized AI assistant that acts as a proxy for the user, mimicking their behavior and preferences. Gatekeepers screen incoming communication requests, make minor decisions, and help users navigate the network.

### Consul

A Consul is a collaborative unit consisting of exactly three connected peers. These groups make collective decisions through voting, work on shared projects, manage common storage, and form a collective AI identity through the combination of their Gatekeepers.

### Crypto System

The Hapa economy is powered by three primary tokens:
1. **Don**: Storage-based cryptocurrency minted when files are shared to the network
2. **Rose**: Used for AI inference operations on the distributed compute system
3. **Bananas**: The general utility token purchased or sold for access to network capabilities

### Network Architecture

The system is built on a hybrid-decentralized architecture using:
- Hypercore protocol for P2P connections
- Decentralized Identifiers (DIDs) for user identity
- Hyperswarm for peer discovery
- HyperDHT/Hyperdrive for distributed storage
- AT Protocol integration via pds.hapa.ai

### Local-First AI

The AI infrastructure in Hapa prioritizes:
- Running models locally on the user's device
- Giving users control over model selection
- Keeping sensitive data on local devices
- Enabling distributed intelligence across the network
- Learning from user behavior to improve over time

## Current Implementation

The application currently implements:
- Basic P2P messaging using Hypercore
- WebRTC video calling with multiple participants
- Real-time transcription using OpenAI Whisper
- AT Protocol integration for Bluesky connectivity
- Task creation and voting mechanism for Consuls
- Basic UI framework for Gatekeeper interaction

## Roadmap

The project is under active development with the following key milestones:

1. **Short-term** (1-3 months): Refine existing functionality, expand Bluesky integration, improve friend system
2. **Medium-term** (3-6 months): Implement Gatekeeper MVP, create Consul foundations, develop distributed storage
3. **Long-term** (6-12 months): Add crypto system, enhance AI capabilities, build comprehensive distributed architecture

## Contributing

Hapa.ai is designed as an open-source project that welcomes community contributions. More details on contribution guidelines can be found in the [Open Source Ecosystem](open-source-ecosystem.md) documentation.

## License

This project is open source and will be released under an appropriate open-source license (details forthcoming). 