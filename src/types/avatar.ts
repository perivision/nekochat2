export type EmotionType =
  | 'happy'
  | 'curious'
  | 'affectionate'
  | 'thoughtful'
  | 'sassy'
  | 'empathetic'
  | 'surprised'
  | 'calm';

export interface EmotionState {
  type: EmotionType;
  valence: number;   // -1.0 (unpleasant) to +1.0 (pleasant)
  arousal: number;   // 0.0 (low energy/calm) to +1.0 (high energy/excited)
  confidence: number;
  label: string;
  purrIntensity: number; // 0.0 to 1.0
  pupilDilation: number; // 0.1 (thin slit) to 0.9 (wide round)
  earAlertness: number;  // 0.0 (flattened/relaxed) to 1.0 (perked high)
  tailAgitation: number; // 0.0 (gentle sway) to 1.0 (fast flick)
}

export interface ConversationSegment {
  id: string;
  timestamp: number;
  userText: string;
  avatarResponse: string;
  summary: string;
  keywords: string[];
  tone: {
    dominant: EmotionType;
    valence: number;
    arousal: number;
  };
  recalledNodeIds?: string[];
  newGraphEntities?: string[];
}

export type NodeType =
  | 'concept'
  | 'user_preference'
  | 'emotion'
  | 'event'
  | 'entity'
  | 'cat_lore';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  mentionCount: number;
  lastRecalled: number;
  created: number;
  color?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  isRecalled?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  weight: number;
  lastRecalled?: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type CoatStyle = 'jiji' | 'tabby' | 'tuxedo' | 'calico' | 'siamese' | 'black' | 'white';

export interface CatPersona {
  id: string;
  name: string;
  breed: string;
  role: string;
  coat: CoatStyle;
  tagline: string;
  systemPrompt: string;
  defaultEmotion: EmotionType;
}

export interface CatBlendshapeTargets {
  mouthOpen: number;       // 0 to 1 (meowing/speaking viseme)
  smile: number;           // 0 to 1
  eyesSquint: number;      // 0 to 1 (soft affectionate squint)
  eyesBlink: number;       // 0 to 1
  pupilDilation: number;   // 0.1 to 0.9
  earLeftTwitch: number;   // -1 to 1
  earRightTwitch: number;  // -1 to 1
  earFlatten: number;      // 0 to 1
  headTiltX: number;       // pitch
  headTiltY: number;       // yaw
  headTiltZ: number;       // roll
  tailSwishSpeed: number;  // frequency
  tailFlickIntensity: number; // amplitude
  breathingRate: number;
  purrVibration: number;
}
