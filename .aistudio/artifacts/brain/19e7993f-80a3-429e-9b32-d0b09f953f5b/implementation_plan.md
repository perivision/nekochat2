# 3D Emotion-Responsive Cat Avatar & Context-Aware Knowledge Graph ("Felis AI")

An interactive, real-time 3D feline companion that responds emotionally to conversation tone with animated facial expressions, ear twitches, and tail physics, powered by a lightweight low-latency emotion engine, conversational memory summarization, and a dynamic long-term knowledge graph.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Avatar Model Switch**: As requested, the avatar character has been switched from a human to an animated 3D Cat companion. The 3D engine features procedural feline anatomy with rich blendshapes (ear articulation, pupil dilation, whisker vibration, meowing mouth visemes, tail swishing, and purr physics) while maintaining full support for uploading custom `.vrm` or `.glb` model files.

- **Confirmed Avatar Type**: Stylized 3D Cat Avatar with procedural skeletal kinematics, ear posture, tail dynamics, and facial morph targets.
- **Tone & Emotion Engine**: Hybrid low-latency engine (instant <15ms client-side rule/lexicon tone scoring for zero-lag posture morphing + Gemini 3.8 Flash for deep conversational empathy and semantic extraction).
- **Long-Term Memory Architecture**: Segment-based memory store (Summary, Keywords, Tone score) populating an interactive Knowledge Graph that automatically retrieves relevant past context into ongoing dialogue.
- **Audio & Vocalization**: Web Speech API TTS paired with procedural Web Audio feline vocalizations (soft purrs, inquisitive chirrups, and meows synced with mouth open/close visemes).

---

## 1. Overview & Core Concept

- **What It Does**: Users converse with an expressive 3D cat avatar in natural language. As the user chats, Felis immediately detects the emotional tone (happy, curious, affectionate, playful, thoughtful, empathetic, surprised, or cheeky) and morphs its ears, eyes (slit vs wide pupils), whiskers, mouth, and tail in real-time. Each conversation segment is processed into structured memory records (segment summary, semantic keywords, emotional tone vector) that populate a context-aware knowledge graph. During subsequent turns, relevant past memories are surfaced and referenced naturally in conversation.
- **Target Audience**: Anyone seeking an engaging, lifelike AI companion, interactive pet simulation, or memory-retrieval conversational assistant with personality and emotional depth.
- **Key Value**: Low-latency emotional immersion combined with genuine long-term memory retrieval, so the avatar never forgets user preferences, stories, and past emotional states.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Interactive 3D Stage**:
   - The user arrives at an immersive 3D scene featuring the animated cat avatar resting on a warm studio pedestal with ambient lighting and subtle breathing motion.
   - Orbit controls allow full 360° inspection, zoom, and perspective panning.
   - An emotion HUD displays the cat's current emotional state, pupil aperture, ear alertness, and purr frequency.
2. **Real-Time Expressive Conversation**:
   - As the user types and sends a message, the client-side emotion engine scores tone within 10ms, causing the cat to perk its ears or tilt its head in immediate anticipation.
   - When the AI response streams in, the cat speaks (with synchronized mouth movements and optional feline voice chirps/Web Speech TTS), animating gestures corresponding to the synthesized emotion.
3. **Contextual Memory & Knowledge Graph Exploration**:
   - The user can toggle an interactive Knowledge Graph drawer or split-view, visualizing nodes (User Profile, Topics, Shared Memories, Emotional Milestones) connected by relational edges.
   - When a past memory is recalled during conversation, the corresponding graph nodes highlight with a golden aura, and an unobtrusive memory badge shows the retrieved connection.
4. **Custom Model Upload & Customization**:
   - Users can drag-and-drop their own 3D model (`.glb`, `.gltf`, `.vrm`) or customize the cat's fur coat (Calico, Tuxedo, Siamese, Golden Tabby, Midnight Black) and eye colors.

### Visual Identity & Theme
- **Aesthetic Direction**: Modern Japanese editorial / boutique virtual studio aesthetic. Deep obsidian and warm charcoal backdrops (`#0F1117`, `#1A1D27`) paired with warm amber accents (`#F59E0B`), soft emerald purr indicators, and crisp bone white typography.
- **Color Palette**:
  - Background Neutral: `#0A0C10` (60%)
  - Structural Cards & Floating Docks: `#131722` with hairline borders `#232B3E` (30%)
  - Accent / Focus: `#EAB308` (Amber Gold) and `#38BDF8` (Sky Blue) (10%)
- **Typography**: Clean display sans (`Plus Jakarta Sans` / `Outfit`) for headers and controls; legible body sans (`DM Sans`) for dialogue text; `font-mono tabular-nums` for emotion vectors and graph telemetry.
- **Spatial Composition**:
  - 100% unobstructed central 3D viewport.
  - Floating bottom dock for speech input, quick mood triggers, and model switchers.
  - Collapsible side panel for Chat History and interactive Knowledge Graph inspector.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Procedural 3D Cat vs External Model Loading**
  - *Chosen Approach*: Implement a procedural 3D feline character rig using Three.js with complete bone hierarchy, blendshapes, ear rotators, pupil dilation shaders, and tail curve kinematics, plus an upload dropzone for `.vrm` / `.glb` files.
  - *Why*: Zero external network dependencies ensure instant 60 FPS loading without 404s or CORS errors, while keeping the door wide open for the user's custom VRM file.
  - *Alternatives Considered*: Fetching external 3D models from arbitrary CDNs (risks CORS errors, sandbox blocklists, or missing textures).
- **Decision 2: Dual Emotion Pipeline (Lightweight Client Engine + Server-Side Gemini)**
  - *Chosen Approach*: A fast regex and sentiment-lexicon analyzer runs in the browser in <15ms to immediately trigger ear twitches, eye dilation, and tail posture the instant text is typed or received; while Gemini 3.8 Flash extracts nuanced emotional nuance and generates conversational replies.
  - *Why*: Eliminates latency lag so the avatar reacts instantly without waiting for a full round-trip network response.
- **Decision 3: In-Memory / LocalStorage Knowledge Graph with Semantic Association**
  - *Chosen Approach*: A rich client/server graph structure tracking entities, relations, confidence, and timestamps, persisted in `localStorage` with export/import capabilities.
  - *Why*: Privacy-preserving, instant retrieval, zero authentication barrier, and full real-time rendering via HTML5 Canvas force-directed graph.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                          │
│                                                                        │
│  ┌───────────────────────────┐         ┌────────────────────────────┐  │
│  │   3D Canvas Viewport      │         │     Chat & Memory Panel    │  │
│  │  - Three.js Scene Rig     │         │  - Real-time Message Stream│  │
│  │  - Cat Skeletal Rig       │         │  - Voice Input / TTS Audio │  │
│  │  - Ear & Whisker Physics  │         │  - Memory Trigger Badges   │  │
│  │  - Eye / Pupil Shader     │         └──────────────┬─────────────┘  │
│  │  - Procedural Tail Curve  │                        │                │
│  └─────────────▲─────────────┘                        │ User Input     │
│                │ Pose/Morph Params                    ▼                │
│  ┌─────────────┴─────────────┐         ┌────────────────────────────┐  │
│  │ Lightweight Emotion Engine│◄────────┤   Knowledge Graph Canvas   │  │
│  │ (<15ms Sentiment Scorer)  │         │ - Force-Directed Nodes     │  │
│  │ - Happy, Curious, Sassy   │         │ - Entity & Topic Clusters  │  │
│  │ - Empathetic, Thoughtful  │         │ - Semantic Relevance Query │  │
│  └─────────────┬─────────────┘         └──────────────▲─────────────┘  │
│                │                                      │                │
└────────────────┼──────────────────────────────────────┼────────────────┘
                 │ HTTP POST /api/chat                  │
                 ▼                                      │ Memory Context
┌───────────────────────────────────────────────────────┴────────────────┐
│                         BACKEND (Express + Node.js)                    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ /api/chat Route (Express)                                        │  │
│  │  1. Ingests User Message & Recalled Graph Context                │  │
│  │  2. Calls Gemini 3.8 Flash for Companion Chat Response           │  │
│  │  3. Extracts Conversation Segment:                               │  │
│  │     - summary: string                                            │  │
│  │     - keywords: string[]                                         │  │
│  │     - tone: { valence: number, arousal: number, dominant: string}│  │
│  │     - extractedGraphTriplets: [subject, relation, object]        │  │
│  │  4. Returns Response Text + Structured Segment Telemetry         │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│                         @google/genai SDK (Server)                     │
│                             (gemini-3.8-flash)                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Models & Memory Representation

```typescript
export interface ConversationSegment {
  id: string;
  timestamp: number;
  userText: string;
  avatarResponse: string;
  summary: string;
  keywords: string[];
  tone: {
    dominant: 'happy' | 'curious' | 'affectionate' | 'thoughtful' | 'sassy' | 'empathetic' | 'surprised' | 'calm';
    valence: number; // -1.0 to 1.0
    arousal: number; // 0.0 to 1.0
  };
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'concept' | 'user_preference' | 'emotion' | 'event' | 'entity';
  mentionCount: number;
  lastRecalled: number;
  relevanceScore?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  weight: number;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

### Component & State Mapping
- `CatAvatarCanvas.tsx`: Initializes Three.js WebGL renderer with `RoomEnvironment`, procedural Cat mesh with head, expressive ears, eyes with dynamic pupils, snout with whiskers, torso, legs, and segmented tail with spring physics.
- `EmotionEngine.ts`: Fast lexical/keyword classifier mapping user & model text to emotion states with smooth spring dampening (`THREE.MathUtils.damp`).
- `KnowledgeGraphView.tsx`: Interactive 2D HTML5 canvas force-directed graph renderer with zoom/pan, node click inspection, and pulse highlights when past memories are active.
- `ChatInterface.tsx`: Message list, voice synthesis controller, memory recall badges, and input dock.
- `server.ts`: Express API running Gemini 3.8 Flash with structured schema extraction for conversation summaries and graph updates.
