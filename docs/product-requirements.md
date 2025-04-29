# Product Requirements Document - Hapa Flowchart

## App Overview

**Name:** Hapa Flowchart  
**Description:** A decentralized, privacy-focused flowchart creation and collaboration tool integrated with Hapa Task Manager and the broader Hapa ecosystem.  
**Tagline:** "Decentralized flowcharts with P2P collaboration and crypto incentives."

## Target Audience

- **Consul Members:** Individuals participating in Hapa's governance structure who need to visualize workflows and decision processes.
- **Project Leads:** Leaders coordinating tasks across distributed teams who need to diagram project flows.
- **Auditors:** Users verifying task completion and workflow integrity who need transparent process documentation.
- **Solo Creators:** Individual users creating personal workflows and task visualizations.
- **Hapa Task Manager Users:** Existing users seeking visual representation of their tasks and projects.

## Key Features and Prioritization

### Core Flowchart Features (Priority: High)
- Drag-and-drop interface for blocks, connectors, and other flowchart elements
- Rich text editing for annotations and labels
- Undo/redo functionality with version history
- Auto-layout options for clean diagram organization
- Import/export capabilities (JSON, SVG formats)
- Responsive design that works on desktop and mobile devices

### Hapa Task Manager Integration (Priority: High)
- Ability to load tasks from Hapa Task Manager API
- Auto-link flowchart nodes to specific tasks via `/task.fetch` RPC
- Display task metadata (DIDs, votes, deadlines) within flowchart nodes
- Create new tasks directly from flowchart nodes
- Automatic synchronization of task status changes

### Collaboration Features (Priority: Medium)
- Real-time P2P collaboration via WebRTC data channels
- Multi-user cursor tracking for enhanced awareness
- Live editing with conflict resolution
- Version history and change tracking
- Permission controls based on Consul voting
- Share flowcharts with specific DIDs (identities) from task membership

### AI and Enhancement Features (Priority: Low)
- Gatekeeper integration for suggested node connections
- Layout optimizations using local Llama.cpp
- Optional GPU Burst refinements (paid in Roses)
- Template recommendations based on flowchart purpose

### Testing and Development Features (Priority: Medium)
- Direct joining of flowcharts via Hyperswarm or Hypercore IDs for testing
- Simulation mode for testing multi-user interactions without actual network connections

## Non-Functional Requirements

### Performance
- Flowchart rendering time < 1 second for diagrams with up to 100 nodes
- Sync latency < 500ms for real-time collaboration
- Smooth animations for drag operations at 60fps
- Efficient memory usage to support large diagrams

### Security and Privacy
- End-to-end encryption for all flowchart data
- Ed25519 signatures for edit verification
- No server-side storage of flowchart data (true P2P)
- Local-first storage with Hypercore/Hyperbee

### Accessibility
- Keyboard shortcuts for all major operations
- Screen reader compatibility
- High-contrast mode option
- Support for zoom and scale adjustments

### Compatibility
- Full functionality in modern browsers (Chrome, Firefox, Safari, Edge)
- Desktop functionality via Electron
- Responsive design for various screen sizes

## User Flows

### Basic Flowchart Creation
1. User opens Hapa Flowchart app
2. Selects "Create New Flowchart"
3. Adds blocks, connectors, and text through intuitive UI
4. Saves locally (automatically synced to Hypercore)
5. Optionally shares with others via DID or Hypercore ID

### Task-Integrated Workflow
1. User opens Hapa Flowchart app
2. Selects "Connect to Task Manager"
3. Browses and selects tasks they have access to
4. Creates or edits flowchart related to selected task
5. Changes automatically sync to all task members

### Collaboration Scenario
1. User receives notification of shared flowchart
2. Opens link/joins via Hypercore ID
3. Views real-time cursors and edits from other members
4. Makes contributions with full version history
5. Participates in Consul voting for major changes (if applicable)

## Assumptions and Constraints

### Assumptions
- Users have basic understanding of flowchart concepts
- Majority of users will have Hapa Task Manager accounts
- P2P connectivity is available for most target users
- Local AI processing capability is sufficient for basic suggestions

### Constraints
- Initial version limited to 2D flowcharts (no 3D)
- Mobile experience may have reduced feature set
- GPU-accelerated features dependent on user hardware
- Offline mode with limited collaboration features

## Success Metrics

- 80% adoption rate among active Consul members
- 50% of Hapa Task Manager users utilizing Flowchart integration
- 30% faster task completion when using visual flowcharts vs. text-only
- Average user satisfaction rating > 4.2/5.0
- 90% synchronization success rate in P2P environments
- Average flowchart creation time < 10 minutes for standard workflows

## Risks and Mitigations

### Technical Risks
- WebRTC connectivity issues → Implement fallback to Hypercore replication
- AI model performance → Optimize Llama.cpp for specific flowchart suggestions
- Data conflicts in multi-user editing → Implement CRDT for conflict resolution

### Adoption Risks
- Learning curve for new users → Create interactive tutorials and templates
- Resistance to crypto incentives → Make crypto features optional but beneficial
- Network fragmentation → Provide robust offline-first experience

## Future Considerations

- Integration with additional Hapa ecosystem applications
- Expanded template library with community contributions
- AI-powered flowchart generation from text descriptions
- Advanced analytics on workflow efficiency
- Extended 3D visualization options for complex workflows 