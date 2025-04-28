# Hapa Protocol – I/O · Storage · Compute · Crypto (Tech Deep-Dive v0.2)

*Audience:* Don 🌻 (module architect) + Builders 🐝  

---

## 1 · I/O Layer (Transport & Messaging)

| Aspect | Current Spec | Notes / TODO |
|--------|--------------|--------------|
| **Primary Packet** | **Rainbow-Wave** header = 4 emojis (8 bytes) + optional payload | Header encodes: glyph 1 = from-sigil, glyph 2 = to-guild, glyph 3 = covenant pass (🌈 / 🌑), glyph 4 = intent (🐝 build, 🕸️ lore, ⚒️ audit, etc.). Header+payload signed (xsalsa20-poly1305). |
| **Transports** | • WebSocket (LAN) <br>• REST fallback (firewall) <br>• WebRTC data (voice/video) <br>• LoRa / audio-FSK (low BW) | Same canonical packet—framing adapters vary. |
| **RPC Semantics** | Idempotent JSON-RPC over Rainbow-Wave; e.g. `/card.cast`, `/credit.transfer`, `/feed.append` | Typed schema generated via proto-mux; TS+Go stubs auto-built. |
| **Undo / Revert** | Prepend ↩️ header → peers roll back hash N in same feed | Auditors ⚒️ verify no double-spend before accept. |

---

## 2 · Storage Layer (“Block-Web”)

| Tier | Engine | Purpose | Notarisation |
|------|--------|---------|--------------|
| **0 – Local** | SQLite (Electron / mobile) | Rapid app state, card cache | Device-only hash |
| **1 – Personal** | Hypercore feed per user | Append-only personal log (“mini-chain”) | Triadic Consul (user + 2 peers) signs root; mints μCredits |
| **2 – Shared** | Hyperbee (many-read, one-write) | Guild vaults, public card sets | Same triadic quorum; shard-id stored in Tier-1 |
| **3 – Cold** | S3 / Glacier / IPFS | Long-term archival, video blobs | Root hash pinned to Tier-1; retrieval earns μCredits |

**Data = Stake** → μCredits minted only when the triad notarises a new chunk and commits to replicate Tier-1 ➜ Tier-3.

---

## 3 · Compute Layer

| Zone | Runtime | Workload | Billing Token |
|------|---------|----------|---------------|
| **Edge** | Llama.cpp / WASM sidecars | Personal AI inference, card effects, low-latency UI logic | Free (battery pays) |
| **Mesh Worker** | Nix-flaked container on bare-metal / VPS | High-CPU card ops, global search, Valuation-AI jobs | `Rose🌹` credits per CPU-sec |
| **GPU Burst** | Stable Horde-style co-op | Image gen / model fine-tune | `Cat🐈` fusion credits |

Work request signed via Rainbow-Wave; μCredit escrow released once auditors confirm completion.

---

## 4 · Crypto-Economic Flow

1. **Notarise chunk** → triad signs Hypercore root → mints **🫰 μCredits** proportional to byte-days pledged.  
2. μCredits auto-split: **70 %** to storage pledgers, **20 %** to auditors ⚒️, **10 %** to Builder fund.  
3. Converting μCredit → 🍌 Banana (AI lift) or 🌹 Rose (human lift) uses **Valuation-AI** oracle (on-chain prompt + off-chain model).  
4. **Abuse guards**  
   * Double-spend: feed-id tie-breaker.  
   * Inflation: reward curve decays after Σ GB stored.  
   * Sybil: one device UUID = one Tier-1 feed pk.

---

## 5 · Open Tickets (Q2 - Q3 2025)

| ID | Topic | Owner | Status |
|----|-------|-------|--------|
| **5-01** | Rainbow-Wave audio FSK codec spec v1 | CJ + ⚒️ guild | draft |
| **5-07** | Valuation-AI prompt hardening (adversarial tests) | Rose 🌹 | research |
| **5-12** | Mesh Worker credit-meter daemon | Don 🐝 | prototype |
| **5-18** | μCredit → Fiat swap plugin (BankShift pilot) | CJ + ext. | scoping |

---

### One-liner mantra

> **I/O** signs intent → **Storage** stakes bytes → **Compute** earns lift → **Crypto** rewards & governs the loop.

Feel free to fork/extend this spec. Pull-requests welcome via Rainbow-Wave `🐝` header packets.
