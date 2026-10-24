import { EmotionType } from '../types/avatar';

class FelineAudioService {
  private audioCtx: AudioContext | null = null;
  private purrOsc: OscillatorNode | null = null;
  private purrGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isPurring = false;
  private isAudioEnabled = true;
  private isSpeechEnabled = true;
  private speechUtterance: SpeechSynthesisUtterance | null = null;
  private onMouthVisemeCallback?: (amplitude: number) => void;
  private visemeInterval: number | null = null;

  private initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setAudioEnabled(enabled: boolean) {
    this.isAudioEnabled = enabled;
    if (!enabled && this.isPurring) {
      this.stopPurr();
    }
  }

  public getAudioEnabled(): boolean {
    return this.isAudioEnabled;
  }

  public setSpeechEnabled(enabled: boolean) {
    this.isSpeechEnabled = enabled;
    if (!enabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.stopVisemes();
    }
  }

  public getSpeechEnabled(): boolean {
    return this.isSpeechEnabled;
  }

  public setVisemeCallback(cb: (amplitude: number) => void) {
    this.onMouthVisemeCallback = cb;
  }

  /**
   * Procedural Cat Purr generator using low-frequency frequency modulation and gentle resonance.
   */
  public startPurr(intensity = 0.5) {
    if (!this.isAudioEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      if (this.isPurring) {
        if (this.purrGain) {
          this.purrGain.gain.setTargetAtTime(intensity * 0.12, this.audioCtx.currentTime, 0.2);
        }
        return;
      }

      const now = this.audioCtx.currentTime;

      // Base carrier low drone (26 Hz - fundamental frequency of domestic cat purr)
      const carrier = this.audioCtx.createOscillator();
      carrier.type = 'triangle';
      carrier.frequency.setValueAtTime(26, now);

      // Tremolo LFO modulator (runs at ~22 Hz, the diaphragm resonance rate)
      const lfo = this.audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(22, now);

      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(8, now);
      lfo.connect(carrier.frequency);

      // Low pass filter to keep it soft, deep and cozy
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.Q.setValueAtTime(2.0, now);

      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.setTargetAtTime(intensity * 0.12, now + 0.05, 0.5);

      carrier.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(this.audioCtx.destination);

      carrier.start(now);
      lfo.start(now);

      this.purrOsc = carrier;
      this.lfo = lfo;
      this.purrGain = masterGain;
      this.isPurring = true;
    } catch {
      // AudioContext policy handled gracefully
    }
  }

  public stopPurr() {
    if (!this.isPurring || !this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      if (this.purrGain) {
        this.purrGain.gain.setTargetAtTime(0.0001, now, 0.2);
      }
      setTimeout(() => {
        try {
          this.purrOsc?.stop();
          this.lfo?.stop();
          this.purrOsc?.disconnect();
          this.lfo?.disconnect();
        } catch {}
        this.purrOsc = null;
        this.lfo = null;
        this.purrGain = null;
        this.isPurring = false;
      }, 250);
    } catch {
      this.isPurring = false;
    }
  }

  /**
   * Procedural Meow sound effect synthesis.
   */
  public playMeow(pitchMultiplier = 1.0) {
    if (!this.isAudioEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = 'sawtooth';
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(4.0, now);

      // Typical domestic cat meow contour: rises then falls (400Hz -> 750Hz -> 500Hz)
      const base = 420 * pitchMultiplier;
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 1.8, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(base * 1.1, now + 0.45);

      filter.frequency.setValueAtTime(800 * pitchMultiplier, now);
      filter.frequency.exponentialRampToValueAtTime(1400 * pitchMultiplier, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(700 * pitchMultiplier, now + 0.45);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.48);

      // Trigger mouth animation
      this.triggerMouthPulse(0.45);
    } catch {}
  }

  /**
   * Procedural Chirrup / Friendly Trill sound effect.
   */
  public playChirrup() {
    if (!this.isAudioEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      // High chirrup staccato ramp
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.08);
      osc.frequency.linearRampToValueAtTime(950, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.2);

      this.triggerMouthPulse(0.2);
    } catch {}
  }

  private triggerMouthPulse(durationSec: number) {
    if (!this.onMouthVisemeCallback) return;
    const start = performance.now();
    const durationMs = durationSec * 1000;

    const step = () => {
      const elapsed = performance.now() - start;
      const progress = elapsed / durationMs;
      if (progress < 1.0) {
        // Sine arc open and close
        const amp = Math.sin(progress * Math.PI) * 0.7;
        this.onMouthVisemeCallback?.(amp);
        requestAnimationFrame(step);
      } else {
        this.onMouthVisemeCallback?.(0);
      }
    };
    requestAnimationFrame(step);
  }

  /**
   * Speaks the response with Web Speech API and synchronizes feline mouth visemes.
   */
  public speakText(text: string, emotion: EmotionType = 'calm', onComplete?: () => void) {
    if (!this.isSpeechEnabled || !('speechSynthesis' in window)) {
      onComplete?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      this.stopVisemes();

      // Clean text of markdown, asterisks, brackets
      const clean = text.replace(/[*#_~`\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!clean) {
        onComplete?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(clean);

      // Pitch and rate adjusted to match cat emotion
      switch (emotion) {
        case 'happy':
        case 'curious':
          utterance.pitch = 1.35;
          utterance.rate = 1.08;
          break;
        case 'affectionate':
        case 'calm':
        case 'empathetic':
          utterance.pitch = 1.15;
          utterance.rate = 0.92;
          break;
        case 'sassy':
          utterance.pitch = 1.4;
          utterance.rate = 1.15;
          break;
        case 'surprised':
          utterance.pitch = 1.5;
          utterance.rate = 1.2;
          break;
        default:
          utterance.pitch = 1.25;
          utterance.rate = 1.0;
      }

      // Pick a soft, friendly voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google'))
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      this.speechUtterance = utterance;

      utterance.onstart = () => {
        this.startVisemes();
      };

      utterance.onend = () => {
        this.stopVisemes();
        this.speechUtterance = null;
        onComplete?.();
      };

      utterance.onerror = () => {
        this.stopVisemes();
        this.speechUtterance = null;
        onComplete?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.stopVisemes();
      onComplete?.();
    }
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.stopVisemes();
    this.speechUtterance = null;
  }

  private startVisemes() {
    this.stopVisemes();
    this.visemeInterval = window.setInterval(() => {
      // Natural speech rhythm oscillation
      const noise = Math.random() * 0.3;
      const wave = Math.abs(Math.sin(performance.now() * 0.012)) * 0.6;
      this.onMouthVisemeCallback?.(wave + noise);
    }, 45);
  }

  private stopVisemes() {
    if (this.visemeInterval !== null) {
      clearInterval(this.visemeInterval);
      this.visemeInterval = null;
    }
    this.onMouthVisemeCallback?.(0);
  }
}

export const felineAudio = new FelineAudioService();
