# Consul System

## Overview

A Consul in the Hapa.ai ecosystem is a collaborative group consisting of exactly three users who form a decentralized decision-making and working unit. Consuls represent the fundamental social and governance structure within Hapa, enabling trusted collaboration, shared resources, and collective intelligence.

## Core Principles

1. **Triadic Structure**: Exactly three members per Consul, creating balanced decision-making
2. **Collective Intelligence**: The combined knowledge and capabilities of both members and their Gatekeepers
3. **Shared Responsibility**: Distributed ownership of tasks, resources, and governance
4. **Consensus Decision-Making**: Voting mechanism to ensure agreement on important matters
5. **Transparent Operation**: Clear tracking of contributions and decisions

## Technical Implementation

### Formation and Identity

- Consuls are formed when three users explicitly agree to form a collective
- Each Consul has a unique identifier derived from the DIDs of its members
- Consul metadata is stored on the Hypercore network for discoverability
- The Consul itself operates as a specialized P2P network between the three members

### Communication Infrastructure

- **Video Conferencing**: Built-in P2P WebRTC-based video calling for meetings
- **Real-time Transcription**: Automatic transcription of meetings using OpenAI Whisper
- **Meeting Summarization**: AI-generated summaries of meetings and key decisions
- **Task Polling**: System to propose, vote on, and track tasks within the Consul
- **Asynchronous Messaging**: Persistent chat for ongoing communication

### Collective AI

- The three members' Gatekeepers can form a collective AI entity
- This collective AI represents the shared interests and knowledge of the Consul
- It can interact with external users and other Consuls on behalf of the group
- The collective AI maintains institutional memory of the Consul's activities

### Storage and Resources

- **Shared Drive**: Decentralized storage using Hyperdrive for Consul files and documents
- **Resource Allocation**: Mechanisms for dedicating compute, storage, or tokens to Consul activities
- **Access Control**: Granular permissions for resources based on Consul decisions
- **Versioning**: History tracking for all shared documents and resources

## Decision Making Process

### Task Creation and Assignment

1. Any member can propose a task during or outside of meetings
2. The system formats the task proposal with clear parameters
3. All members vote to accept or reject the task
4. Accepted tasks are tracked in the shared task system
5. Task completion is verified by consensus

### Voting Mechanism

- Simple majority (2 out of 3) required for most decisions
- Vote records are stored in the Consul's Hypercore feed
- Each member has equal voting power
- Voting can be conducted synchronously during meetings or asynchronously
- The UI clearly shows current votes and decision status

### Compensation and Rewards

- Consuls can receive compensation as a unit from the wider Hapa network
- Internal distribution of rewards based on contribution tracking
- Token incentives for completed tasks and milestones
- Transparent accounting of all resource flows

## Use Cases

### Project Collaboration

- Small teams working on focused projects or products
- Clear task assignment and accountability
- Shared vision and collective problem-solving
- Built-in meeting and documentation tooling

### Governance Participation

- Consuls can participate in network-wide governance
- Representation of collective interests in larger decisions
- Delegated voting power for protocol changes
- Consul-to-Consul negotiations for larger initiatives

### Resource Pooling

- Pooling of compute resources for AI inference tasks
- Shared storage allocation for larger datasets
- Collective token staking for economic opportunities
- Joint funding of development initiatives

### Knowledge Communities

- Formation of specialized expertise groups
- Production of educational content and resources
- Curation of information in specific domains
- Mentorship and knowledge transfer activities

## Implementation Status

The current implementation includes:
- P2P video calling infrastructure using WebRTC
- Transcription of meetings using OpenAI Whisper
- Task creation and voting system for Consul decisions
- Basic UI for Consul interactions and task management
- Meeting summarization functionality
- Framework for tracking votes and consensus

## Future Development

- Enhanced collective AI functionality through advanced LLM integration
- Improved resource tracking and allocation mechanisms
- Development of Consul directory and discovery features
- Advanced analytics on Consul performance and productivity
- Inter-Consul communication and collaboration protocols
- Formal representation of Consuls in network governance
- Implementation of Consul-specific token incentives 