import { EmotionState, EmotionType, CatBlendshapeTargets } from '../types/avatar';

// Sentiment Lexicon with emotional valence (-1 to +1) and arousal (0 to 1)
const EMOTION_LEXICON: Record<string, { type: EmotionType; valence: number; arousal: number; weight: number }> = {
  // Joy / Happy / Love
  love: { type: 'affectionate', valence: 0.9, arousal: 0.6, weight: 1.5 },
  adorable: { type: 'affectionate', valence: 0.85, arousal: 0.7, weight: 1.4 },
  cute: { type: 'affectionate', valence: 0.8, arousal: 0.6, weight: 1.3 },
  sweet: { type: 'affectionate', valence: 0.75, arousal: 0.4, weight: 1.2 },
  pet: { type: 'affectionate', valence: 0.7, arousal: 0.4, weight: 1.2 },
  hug: { type: 'affectionate', valence: 0.85, arousal: 0.5, weight: 1.4 },
  cuddle: { type: 'affectionate', valence: 0.9, arousal: 0.4, weight: 1.5 },
  purr: { type: 'affectionate', valence: 0.8, arousal: 0.5, weight: 1.3 },
  happy: { type: 'happy', valence: 0.85, arousal: 0.7, weight: 1.4 },
  joy: { type: 'happy', valence: 0.9, arousal: 0.8, weight: 1.5 },
  great: { type: 'happy', valence: 0.7, arousal: 0.6, weight: 1.0 },
  awesome: { type: 'happy', valence: 0.85, arousal: 0.8, weight: 1.3 },
  wonderful: { type: 'happy', valence: 0.85, arousal: 0.7, weight: 1.3 },
  excited: { type: 'happy', valence: 0.8, arousal: 0.9, weight: 1.5 },
  fun: { type: 'happy', valence: 0.75, arousal: 0.7, weight: 1.1 },
  play: { type: 'happy', valence: 0.75, arousal: 0.8, weight: 1.2 },
  yay: { type: 'happy', valence: 0.9, arousal: 0.85, weight: 1.4 },
  laugh: { type: 'happy', valence: 0.8, arousal: 0.7, weight: 1.2 },

  // Curiosity / Exploration / Questions
  why: { type: 'curious', valence: 0.2, arousal: 0.6, weight: 1.1 },
  how: { type: 'curious', valence: 0.2, arousal: 0.5, weight: 1.0 },
  what: { type: 'curious', valence: 0.1, arousal: 0.5, weight: 0.9 },
  where: { type: 'curious', valence: 0.2, arousal: 0.5, weight: 0.9 },
  who: { type: 'curious', valence: 0.2, arousal: 0.5, weight: 0.9 },
  curious: { type: 'curious', valence: 0.4, arousal: 0.6, weight: 1.4 },
  wonder: { type: 'curious', valence: 0.3, arousal: 0.5, weight: 1.2 },
  investigate: { type: 'curious', valence: 0.3, arousal: 0.7, weight: 1.2 },
  mystery: { type: 'curious', valence: 0.3, arousal: 0.6, weight: 1.1 },
  explore: { type: 'curious', valence: 0.5, arousal: 0.7, weight: 1.2 },
  interesting: { type: 'curious', valence: 0.5, arousal: 0.5, weight: 1.1 },

  // Sadness / Anxiety / Stress / Empathy
  sad: { type: 'empathetic', valence: -0.7, arousal: 0.3, weight: 1.4 },
  crying: { type: 'empathetic', valence: -0.8, arousal: 0.5, weight: 1.5 },
  depressed: { type: 'empathetic', valence: -0.85, arousal: 0.2, weight: 1.5 },
  tired: { type: 'empathetic', valence: -0.4, arousal: 0.2, weight: 1.1 },
  exhausted: { type: 'empathetic', valence: -0.5, arousal: 0.2, weight: 1.2 },
  hurt: { type: 'empathetic', valence: -0.75, arousal: 0.6, weight: 1.4 },
  lonely: { type: 'empathetic', valence: -0.7, arousal: 0.3, weight: 1.3 },
  anxious: { type: 'empathetic', valence: -0.6, arousal: 0.7, weight: 1.4 },
  stress: { type: 'empathetic', valence: -0.6, arousal: 0.7, weight: 1.3 },
  stressed: { type: 'empathetic', valence: -0.65, arousal: 0.7, weight: 1.4 },
  overwhelmed: { type: 'empathetic', valence: -0.7, arousal: 0.7, weight: 1.4 },
  scared: { type: 'empathetic', valence: -0.75, arousal: 0.8, weight: 1.4 },
  sorry: { type: 'empathetic', valence: -0.3, arousal: 0.3, weight: 1.0 },

  // Thoughtful / Deep / Philosophy
  think: { type: 'thoughtful', valence: 0.1, arousal: 0.3, weight: 1.0 },
  ponder: { type: 'thoughtful', valence: 0.1, arousal: 0.2, weight: 1.3 },
  meaning: { type: 'thoughtful', valence: 0.1, arousal: 0.3, weight: 1.2 },
  future: { type: 'thoughtful', valence: 0.2, arousal: 0.4, weight: 1.0 },
  past: { type: 'thoughtful', valence: 0.0, arousal: 0.3, weight: 1.0 },
  remember: { type: 'thoughtful', valence: 0.2, arousal: 0.4, weight: 1.2 },
  memory: { type: 'thoughtful', valence: 0.2, arousal: 0.3, weight: 1.1 },
  deep: { type: 'thoughtful', valence: 0.2, arousal: 0.3, weight: 1.0 },
  philosophy: { type: 'thoughtful', valence: 0.2, arousal: 0.3, weight: 1.3 },

  // Sassy / Cheeky / Playful attitude
  sassy: { type: 'sassy', valence: 0.4, arousal: 0.6, weight: 1.5 },
  tease: { type: 'sassy', valence: 0.4, arousal: 0.7, weight: 1.3 },
  whatever: { type: 'sassy', valence: 0.0, arousal: 0.4, weight: 1.3 },
  boss: { type: 'sassy', valence: 0.3, arousal: 0.6, weight: 1.1 },
  attitude: { type: 'sassy', valence: 0.2, arousal: 0.6, weight: 1.2 },
  nah: { type: 'sassy', valence: -0.1, arousal: 0.3, weight: 1.0 },
  fool: { type: 'sassy', valence: 0.1, arousal: 0.5, weight: 1.1 },
  catnip: { type: 'sassy', valence: 0.8, arousal: 0.9, weight: 1.5 },

  // Surprise / Shock
  wow: { type: 'surprised', valence: 0.5, arousal: 0.85, weight: 1.5 },
  whoa: { type: 'surprised', valence: 0.4, arousal: 0.8, weight: 1.4 },
  omg: { type: 'surprised', valence: 0.3, arousal: 0.9, weight: 1.5 },
  unbelievable: { type: 'surprised', valence: 0.3, arousal: 0.8, weight: 1.4 },
  shocking: { type: 'surprised', valence: -0.2, arousal: 0.85, weight: 1.4 },
  sudden: { type: 'surprised', valence: 0.1, arousal: 0.7, weight: 1.1 },

  // Calm / Peaceful
  calm: { type: 'calm', valence: 0.6, arousal: 0.1, weight: 1.4 },
  peace: { type: 'calm', valence: 0.7, arousal: 0.1, weight: 1.4 },
  relax: { type: 'calm', valence: 0.7, arousal: 0.15, weight: 1.4 },
  sleepy: { type: 'calm', valence: 0.4, arousal: 0.05, weight: 1.3 },
  breathe: { type: 'calm', valence: 0.5, arousal: 0.15, weight: 1.2 },
  cozy: { type: 'calm', valence: 0.8, arousal: 0.2, weight: 1.3 },
  nap: { type: 'calm', valence: 0.6, arousal: 0.1, weight: 1.2 },
  warm: { type: 'calm', valence: 0.6, arousal: 0.2, weight: 1.1 }
};

export class EmotionEngine {
  private currentEmotion: EmotionState = {
    type: 'calm',
    valence: 0.2,
    arousal: 0.2,
    confidence: 0.8,
    label: 'Peacefully relaxed',
    purrIntensity: 0.3,
    pupilDilation: 0.45,
    earAlertness: 0.5,
    tailAgitation: 0.2
  };

  /**
   * Fast lexical and syntactic analyzer (<10ms execution time).
   */
  public analyzeText(text: string): EmotionState {
    const cleanText = text.toLowerCase();
    const words = cleanText.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

    let totalValence = 0;
    let totalArousal = 0;
    let totalWeight = 0;

    const counts: Record<EmotionType, number> = {
      happy: 0,
      curious: 0,
      affectionate: 0,
      thoughtful: 0,
      sassy: 0,
      empathetic: 0,
      surprised: 0,
      calm: 0
    };

    // Keyword matching
    for (const word of words) {
      if (EMOTION_LEXICON[word]) {
        const item = EMOTION_LEXICON[word];
        counts[item.type] += item.weight;
        totalValence += item.valence * item.weight;
        totalArousal += item.arousal * item.weight;
        totalWeight += item.weight;
      }
    }

    // Syntactic cues
    const questionMarks = (cleanText.match(/\?/g) || []).length;
    const exclamationMarks = (cleanText.match(/!/g) || []).length;

    if (questionMarks > 0) {
      counts.curious += questionMarks * 1.5;
      totalArousal += 0.3;
      totalWeight += 1;
    }
    if (exclamationMarks > 0) {
      totalArousal += Math.min(0.5, exclamationMarks * 0.2);
      if (totalValence >= 0) {
        counts.happy += exclamationMarks * 1.2;
      } else {
        counts.surprised += exclamationMarks * 1.0;
      }
      totalWeight += 1;
    }

    // Determine dominant emotion
    let dominant: EmotionType = 'calm';
    let maxScore = 0;

    for (const [type, score] of Object.entries(counts) as [EmotionType, number][]) {
      if (score > maxScore) {
        maxScore = score;
        dominant = type;
      }
    }

    const avgValence = totalWeight > 0 ? totalValence / totalWeight : 0.2;
    const avgArousal = totalWeight > 0 ? Math.min(1.0, totalArousal / totalWeight) : 0.25;

    // Build feline specific parameters
    const state = this.createEmotionState(dominant, avgValence, avgArousal, maxScore > 0 ? 0.85 : 0.5);
    this.currentEmotion = state;
    return state;
  }

  public setEmotionDirectly(dominant: EmotionType, valence = 0.5, arousal = 0.5): EmotionState {
    const state = this.createEmotionState(dominant, valence, arousal, 1.0);
    this.currentEmotion = state;
    return state;
  }

  public getCurrentEmotion(): EmotionState {
    return this.currentEmotion;
  }

  private createEmotionState(
    type: EmotionType,
    valence: number,
    arousal: number,
    confidence: number
  ): EmotionState {
    let label = 'Peacefully relaxed';
    let purrIntensity = 0.2;
    let pupilDilation = 0.45;
    let earAlertness = 0.5;
    let tailAgitation = 0.2;

    switch (type) {
      case 'happy':
        label = 'Happy & purring';
        purrIntensity = 0.85;
        pupilDilation = 0.65;
        earAlertness = 0.8;
        tailAgitation = 0.45;
        break;
      case 'affectionate':
        label = 'Loving & cuddly';
        purrIntensity = 0.95;
        pupilDilation = 0.75;
        earAlertness = 0.45;
        tailAgitation = 0.2;
        break;
      case 'curious':
        label = 'Intrigued & inquisitive';
        purrIntensity = 0.15;
        pupilDilation = 0.85;
        earAlertness = 0.95;
        tailAgitation = 0.55;
        break;
      case 'thoughtful':
        label = 'Contemplating';
        purrIntensity = 0.3;
        pupilDilation = 0.35;
        earAlertness = 0.6;
        tailAgitation = 0.25;
        break;
      case 'sassy':
        label = 'Playfully cheeky';
        purrIntensity = 0.2;
        pupilDilation = 0.3;
        earAlertness = 0.7;
        tailAgitation = 0.8;
        break;
      case 'empathetic':
        label = 'Comforting & caring';
        purrIntensity = 0.9;
        pupilDilation = 0.55;
        earAlertness = 0.4;
        tailAgitation = 0.15;
        break;
      case 'surprised':
        label = 'Startled & alert';
        purrIntensity = 0.0;
        pupilDilation = 0.9;
        earAlertness = 1.0;
        tailAgitation = 0.85;
        break;
      case 'calm':
      default:
        label = 'Calm & serene';
        purrIntensity = 0.4;
        pupilDilation = 0.45;
        earAlertness = 0.4;
        tailAgitation = 0.2;
        break;
    }

    return {
      type,
      valence,
      arousal,
      confidence,
      label,
      purrIntensity,
      pupilDilation,
      earAlertness,
      tailAgitation
    };
  }

  /**
   * Computes numerical blendshape target values for the 3D Cat character mesh
   */
  public getBlendshapeTargets(
    emotion: EmotionState,
    isSpeaking = false,
    audioEnergy = 0
  ): CatBlendshapeTargets {
    const base: CatBlendshapeTargets = {
      mouthOpen: isSpeaking ? 0.3 + audioEnergy * 0.5 : 0.0,
      smile: 0.1,
      eyesSquint: 0.0,
      eyesBlink: 0.0,
      pupilDilation: emotion.pupilDilation,
      earLeftTwitch: 0.0,
      earRightTwitch: 0.0,
      earFlatten: 0.0,
      headTiltX: 0.0,
      headTiltY: 0.0,
      headTiltZ: 0.0,
      tailSwishSpeed: 1.0,
      tailFlickIntensity: 0.3,
      breathingRate: 1.0,
      purrVibration: emotion.purrIntensity
    };

    switch (emotion.type) {
      case 'happy':
        base.smile = 0.85;
        base.eyesSquint = 0.4;
        base.tailSwishSpeed = 1.8;
        base.tailFlickIntensity = 0.5;
        base.breathingRate = 1.3;
        break;
      case 'affectionate':
        base.smile = 0.9;
        base.eyesSquint = 0.7; // "slow blink" loving squint
        base.headTiltZ = 0.08;
        base.headTiltX = -0.05;
        base.tailSwishSpeed = 0.9;
        base.tailFlickIntensity = 0.2;
        break;
      case 'curious':
        base.headTiltZ = 0.25; // inquisitive head cock
        base.headTiltY = 0.1;
        base.earLeftTwitch = 0.2;
        base.earRightTwitch = -0.1;
        base.tailSwishSpeed = 1.5;
        base.tailFlickIntensity = 0.6;
        break;
      case 'thoughtful':
        base.headTiltX = 0.08;
        base.eyesSquint = 0.3;
        base.earLeftTwitch = -0.15;
        base.tailSwishSpeed = 0.7;
        base.tailFlickIntensity = 0.2;
        break;
      case 'sassy':
        base.headTiltY = -0.15;
        base.headTiltZ = -0.1;
        base.earFlatten = 0.35;
        base.smile = 0.3;
        base.tailSwishSpeed = 2.4;
        base.tailFlickIntensity = 0.85; // twitchy tail tip
        break;
      case 'empathetic':
        base.smile = 0.4;
        base.eyesSquint = 0.45;
        base.headTiltX = -0.06;
        base.breathingRate = 0.8;
        base.tailSwishSpeed = 0.7;
        break;
      case 'surprised':
        base.headTiltX = -0.15;
        base.earFlatten = 0.1;
        base.mouthOpen = Math.max(base.mouthOpen, 0.4);
        base.tailSwishSpeed = 3.0;
        base.tailFlickIntensity = 0.9;
        base.breathingRate = 1.8;
        break;
      case 'calm':
      default:
        base.smile = 0.15;
        base.tailSwishSpeed = 0.8;
        base.breathingRate = 0.85;
        break;
    }

    return base;
  }
}

export const emotionEngine = new EmotionEngine();
