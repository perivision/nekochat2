import React, { useState, useEffect, useCallback } from 'react';
import { CatAvatarCanvas } from './components/3d/CatAvatarCanvas';
import { ChatPanel } from './components/chat/ChatPanel';
import { DebugTelemetryPanel } from './components/debug/DebugTelemetryPanel';
import { emotionEngine } from './services/emotionEngine';
import { felineAudio } from './services/felineAudio';
import { knowledgeGraphStore } from './services/knowledgeGraphStore';
import { CAT_PERSONAS } from './services/catPersonas';
import {
  EmotionState,
  EmotionType,
  CoatStyle,
  CatPersona,
  ConversationSegment,
  CatBlendshapeTargets
} from './types/avatar';
import { Bug, Sparkles, RotateCcw } from 'lucide-react';

export default function App() {
  const [activePersona, setActivePersona] = useState<CatPersona>(CAT_PERSONAS[0]);
  const [coatStyle, setCoatStyle] = useState<CoatStyle>(CAT_PERSONAS[0].coat);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>(() =>
    emotionEngine.setEmotionDirectly(CAT_PERSONAS[0].defaultEmotion)
  );

  const [blendshapes, setBlendshapes] = useState<CatBlendshapeTargets>(() =>
    emotionEngine.getBlendshapeTargets(currentEmotion, false, 0)
  );

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [segments, setSegments] = useState<ConversationSegment[]>(() =>
    knowledgeGraphStore.getSegments()
  );
  const [latestSegment, setLatestSegment] = useState<ConversationSegment | null>(null);
  const [recalledSegment, setRecalledSegment] = useState<ConversationSegment | null>(null);

  // Sync segments from KnowledgeGraphStore
  useEffect(() => {
    const unsubscribe = knowledgeGraphStore.subscribe(() => {
      const all = knowledgeGraphStore.getSegments();
      setSegments([...all]);
      if (all.length > 0) {
        setLatestSegment(all[all.length - 1]);
      }
    });
    return unsubscribe;
  }, []);

  // Sync mouth visemes from audio service
  useEffect(() => {
    felineAudio.setVisemeCallback((amplitude: number) => {
      setBlendshapes(prev => ({
        ...prev,
        mouthOpen: amplitude
      }));
    });
  }, []);

  // Update blendshapes whenever emotion changes
  const updateEmotionState = useCallback((newEmotion: EmotionState, speaking = isSpeaking) => {
    setCurrentEmotion(newEmotion);
    setBlendshapes(emotionEngine.getBlendshapeTargets(newEmotion, speaking, 0));

    // Auto-adjust purr sound
    if (newEmotion.purrIntensity > 0.4) {
      felineAudio.startPurr(newEmotion.purrIntensity);
    } else {
      felineAudio.stopPurr();
    }
  }, [isSpeaking]);

  // Ultra-low latency typing feedback (<15ms)
  const handleTypingChange = useCallback((text: string) => {
    if (!text.trim()) {
      return;
    }
    const liveEmotion = emotionEngine.analyzeText(text);
    updateEmotionState(liveEmotion);
  }, [updateEmotionState]);

  // Handle User Message Submission
  const handleSendMessage = async (userText: string) => {
    setIsLoading(true);

    try {
      // 1. Context-Aware Memory Retrieval: Query Knowledge Graph
      const { relevantSegments, contextString } = knowledgeGraphStore.queryRelevantMemories(userText);
      if (relevantSegments.length > 0) {
        setRecalledSegment(relevantSegments[0]);
      } else {
        setRecalledSegment(null);
      }

      // 2. Immediate Client-Side Tone Score
      const fastEmotion = emotionEngine.analyzeText(userText);
      updateEmotionState(fastEmotion);

      // 3. Server-side Gemini 3.8 Flash Call
      const historyPayload = segments.slice(-6).map(s => [
        { role: 'user', content: s.userText },
        { role: 'model', content: s.avatarResponse }
      ]).flat();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          conversationHistory: historyPayload,
          activePersona,
          relevantMemories: contextString
        })
      });

      const data = await response.json();

      const avatarResponse = data.avatarResponse || 'Purr... I hear you!';
      const tone = data.tone || {
        dominant: fastEmotion.type,
        valence: fastEmotion.valence,
        arousal: fastEmotion.arousal
      };
      const summary = data.summary || userText.slice(0, 60);
      const keywords = data.keywords || ['chat'];
      const triplets = data.extractedGraphTriplets || [];

      // 4. Update Knowledge Graph with new segment
      const newSeg = knowledgeGraphStore.addSegment({
        userText,
        avatarResponse,
        summary,
        keywords,
        tone,
        triplets
      });
      setLatestSegment(newSeg);

      // 5. Update emotion state from model's synthesis
      const modelEmotion = emotionEngine.setEmotionDirectly(
        tone.dominant as EmotionType,
        tone.valence,
        tone.arousal
      );
      updateEmotionState(modelEmotion, true);

      // 6. Append message to chat panel UI
      const appendFn = (window as unknown as { appendCatMessage?: (text: string, tone: string, recalled?: string) => void }).appendCatMessage;
      appendFn?.(
        avatarResponse,
        tone.dominant,
        relevantSegments.length > 0 ? relevantSegments[0].summary : undefined
      );

      // 7. Vocalize via Speech Synthesis with real-time mouth movement
      setIsSpeaking(true);
      felineAudio.speakText(avatarResponse, tone.dominant as EmotionType, () => {
        setIsSpeaking(false);
        updateEmotionState(modelEmotion, false);
      });

    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEmotionTrigger = (emotionType: EmotionType) => {
    const state = emotionEngine.setEmotionDirectly(emotionType);
    updateEmotionState(state);

    if (emotionType === 'curious' || emotionType === 'happy') {
      felineAudio.playChirrup();
    } else if (emotionType === 'sassy' || emotionType === 'surprised') {
      felineAudio.playMeow(1.3);
    }
  };

  const handleSelectPersona = (p: CatPersona) => {
    setActivePersona(p);
    setCoatStyle(p.coat);
    const em = emotionEngine.setEmotionDirectly(p.defaultEmotion);
    updateEmotionState(em);
  };

  const handleResetMemory = () => {
    if (window.confirm('Reset all learned memories and knowledge graph back to defaults?')) {
      knowledgeGraphStore.resetMemory();
      setRecalledSegment(null);
      setLatestSegment(null);
    }
  };

  /**
   * The User View:
   * Displays only the 3D cat on top and the conversation below it.
   */
  const renderUserView = () => (
    <div className="flex flex-col h-full w-full bg-[#0A0C10] overflow-hidden">
      {/* Upper Section: 3D Cat Canvas */}
      <div className="h-[46%] sm:h-[50%] w-full relative shrink-0 border-b border-[#1F2739] bg-[#0A0C10]">
        <CatAvatarCanvas
          emotion={currentEmotion}
          blendshapes={blendshapes}
          coatStyle={coatStyle}
          onCoatChange={setCoatStyle}
          isSpeaking={isSpeaking}
          showOverlayTelemetry={debugMode}
        />
      </div>

      {/* Lower Section: Conversation View */}
      <div className="flex-1 w-full overflow-hidden flex flex-col min-h-0 bg-[#0E1118]">
        <ChatPanel
          onSendMessage={handleSendMessage}
          onTypingChange={handleTypingChange}
          isLoading={isLoading}
          activePersona={activePersona}
          onSelectPersona={handleSelectPersona}
          currentEmotion={currentEmotion}
          recalledSegment={recalledSegment}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0A0C10] text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-6 px-5 py-2.5 border-b border-[#1E2538] bg-[#0E1118] shrink-0 z-30">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
            🐱
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Jiji · Chatbot Cat
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            (Kiki's Delivery Service)
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleResetMemory}
            title="Reset long-term memory graph"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-[#161B28] hover:bg-[#1E2436] border border-[#232B3E] rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Memory</span>
          </button>

          {/* Debug Mode Toggle Switch */}
          <button
            onClick={() => setDebugMode(d => !d)}
            title="Toggle two-frame debug mode with full animation and emotion output"
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
              debugMode
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                : 'bg-[#161B28] hover:bg-[#1E2436] border-[#232B3E] text-slate-300 hover:text-white'
            }`}
          >
            <Bug className={`w-3.5 h-3.5 ${debugMode ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Debug Mode: {debugMode ? 'ON (2 Frames)' : 'OFF'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame(s) */}
      <div className="flex-1 flex overflow-hidden relative">
        {!debugMode ? (
          /* Normal User View: Only the cat and the conversation below it */
          <div className="w-full h-full max-w-5xl mx-auto flex flex-col shadow-2xl border-x border-[#1F2739]/40">
            {renderUserView()}
          </div>
        ) : (
          /* Debug Mode: Two side-by-side frames */
          <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
            {/* Left Frame: User View (Cat on top, conversation below it) */}
            <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-[#1F2739]">
              <div className="px-3 py-1.5 bg-[#121622] border-b border-[#1F2739] text-[11px] font-mono text-slate-400 flex items-center justify-between shrink-0">
                <span className="font-bold text-slate-200 uppercase tracking-wider">
                  Frame 1: User View
                </span>
                <span>[Cat Above · Conversation Below]</span>
              </div>
              <div className="flex-1 overflow-hidden">
                {renderUserView()}
              </div>
            </div>

            {/* Right Frame: Full Output Debug Inspector */}
            <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-[#0D1017]">
              <DebugTelemetryPanel
                emotion={currentEmotion}
                blendshapes={blendshapes}
                latestSegment={latestSegment}
                segments={segments}
                onTriggerEmotion={handleManualEmotionTrigger}
                coatStyle={coatStyle}
                onSelectCoat={setCoatStyle}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
