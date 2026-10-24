import React, { useState, useEffect } from 'react';
import {
  EmotionState,
  EmotionType,
  CatBlendshapeTargets,
  ConversationSegment,
  CoatStyle
} from '../../types/avatar';
import { KnowledgeGraphCanvas } from '../graph/KnowledgeGraphCanvas';
import { Activity, Gauge, Terminal, Brain, Sparkles, Smile, RefreshCw, Sliders, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ServerLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}

interface Props {
  emotion: EmotionState;
  blendshapes: CatBlendshapeTargets;
  latestSegment: ConversationSegment | null;
  segments: ConversationSegment[];
  onTriggerEmotion: (emotion: EmotionType) => void;
  coatStyle: CoatStyle;
  onSelectCoat: (coat: CoatStyle) => void;
}

export const DebugTelemetryPanel: React.FC<Props> = ({
  emotion,
  blendshapes,
  latestSegment,
  segments,
  onTriggerEmotion,
  coatStyle,
  onSelectCoat
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'logs' | 'graph'>('telemetry');
  const [serverLogs, setServerLogs] = useState<ServerLog[]>([]);
  const [keyStatus, setKeyStatus] = useState<'connected' | 'credits_depleted'>('connected');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setServerLogs(data.logs || []);
        if (data.keyStatus) {
          setKeyStatus(data.keyStatus);
        }
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const emotions: EmotionType[] = [
    'sassy',
    'curious',
    'happy',
    'affectionate',
    'thoughtful',
    'empathetic',
    'surprised',
    'calm'
  ];

  return (
    <div className="flex flex-col h-full bg-[#0D1017] border-l border-[#1F2739] text-slate-200 select-none overflow-hidden font-mono text-xs">
      {/* Debug Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1F2739] bg-[#121622] shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
            Engine Debug & Telemetry
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-[#0A0C10] rounded-lg border border-[#232B3E]">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              activeTab === 'telemetry'
                ? 'bg-[#1E2538] text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Telemetry & Anim
          </button>
          <button
            onClick={() => {
              setActiveTab('logs');
              fetchLogs();
            }}
            className={`px-2 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'logs'
                ? 'bg-[#1E2538] text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Server Logs</span>
            {serverLogs.some(l => l.level === 'error') && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              activeTab === 'graph'
                ? 'bg-[#1E2538] text-blue-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Graph ({segments.length})
          </button>
        </div>
      </div>

      {/* Billing Credit Status Alert */}
      {keyStatus === 'credits_depleted' && (
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-700/50 flex items-start gap-2 text-amber-200 text-[11px] shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Project Notice (HTTP 402): </span>
            <span>Prepayment credits are depleted on this project. To use your claimed billing credits, make sure the project with your credits is selected in AI Studio at </span>
            <span className="font-semibold text-amber-300 underline">https://ai.studio/projects</span>.
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'telemetry' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. Detected Emotion & Sentiment Polarity */}
          <section className="p-3 bg-[#131722] border border-[#232B3E] rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Detected Emotion & Tone
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px]">
                {emotion.type}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
              <div className="p-2 bg-[#0B0D13] rounded-lg border border-[#1E2538]">
                <div className="text-slate-400 text-[10px] mb-1">State Label</div>
                <div className="font-semibold text-slate-100">{emotion.label}</div>
              </div>
              <div className="p-2 bg-[#0B0D13] rounded-lg border border-[#1E2538]">
                <div className="text-slate-400 text-[10px] mb-1">Confidence Score</div>
                <div className="font-semibold text-emerald-400 tabular-nums">
                  {(emotion.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Valence Gauge */}
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Valence (Pleasantness)</span>
                <span className="text-slate-200 tabular-nums font-bold">
                  {emotion.valence > 0 ? `+${emotion.valence.toFixed(2)}` : emotion.valence.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-2 bg-[#0A0C10] rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-200"
                  style={{ width: `${Math.max(5, Math.min(100, (emotion.valence + 1) * 50))}%` }}
                />
              </div>
            </div>

            {/* Arousal Gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Arousal (Energy / Intensity)</span>
                <span className="text-slate-200 tabular-nums font-bold">
                  {emotion.arousal.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-2 bg-[#0A0C10] rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-amber-500 rounded-full transition-all duration-200"
                  style={{ width: `${Math.max(5, Math.min(100, emotion.arousal * 100))}%` }}
                />
              </div>
            </div>
          </section>

          {/* 2. Feline Mood & Biological Telemetry */}
          <section className="p-3 bg-[#131722] border border-[#232B3E] rounded-xl shadow-sm">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              Mood & Physical State
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-[#0B0D13] rounded-lg border border-[#1E2538] flex flex-col justify-between">
                <span className="text-slate-400 text-[10px]">Pupil Dilation</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-slate-100 tabular-nums">
                    {(emotion.pupilDilation * 100).toFixed(0)}%
                  </span>
                  <div
                    className="rounded-full bg-amber-400 transition-all duration-150"
                    style={{
                      width: `${Math.max(6, emotion.pupilDilation * 18)}px`,
                      height: `${Math.max(6, emotion.pupilDilation * 18)}px`
                    }}
                  />
                </div>
              </div>

              <div className="p-2 bg-[#0B0D13] rounded-lg border border-[#1E2538] flex flex-col justify-between">
                <span className="text-slate-400 text-[10px]">Ear Alertness</span>
                <div className="font-bold text-slate-100 mt-1 tabular-nums">
                  {(emotion.earAlertness * 100).toFixed(0)}%
                </div>
              </div>

              <div className="p-2 bg-[#0B0D13] rounded-lg border border-[#1E2538] flex flex-col justify-between">
                <span className="text-slate-400 text-[10px]">Purr Intensity</span>
                <div className="font-bold text-emerald-400 mt-1 tabular-nums">
                  {(emotion.purrIntensity * 100).toFixed(0)}%
                </div>
              </div>

              <div className="p-2 bg-[#0B0D13] rounded-lg border border-[#1E2538] flex flex-col justify-between">
                <span className="text-slate-400 text-[10px]">Tail Agitation</span>
                <div className="font-bold text-amber-400 mt-1 tabular-nums">
                  {(emotion.tailAgitation * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </section>

          {/* 3. Real-Time Animation Commands & Blendshapes */}
          <section className="p-3 bg-[#131722] border border-[#232B3E] rounded-xl shadow-sm">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Active Animation Commands
            </span>

            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="flex justify-between py-1 px-2 bg-[#0B0D13] rounded border border-[#1E2538]">
                <span className="text-slate-400">mouthOpen (Viseme Amplitude):</span>
                <span className="text-amber-400 font-bold tabular-nums">
                  {blendshapes.mouthOpen.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between py-1 px-2 bg-[#0B0D13] rounded border border-[#1E2538]">
                <span className="text-slate-400">headTilt [X, Y, Z]:</span>
                <span className="text-slate-200 tabular-nums">
                  [{blendshapes.headTiltX.toFixed(2)}, {blendshapes.headTiltY.toFixed(2)}, {blendshapes.headTiltZ.toFixed(2)}]
                </span>
              </div>
              <div className="flex justify-between py-1 px-2 bg-[#0B0D13] rounded border border-[#1E2538]">
                <span className="text-slate-400">earTwitch [L, R]:</span>
                <span className="text-slate-200 tabular-nums">
                  [{blendshapes.earLeftTwitch.toFixed(2)}, {blendshapes.earRightTwitch.toFixed(2)}]
                </span>
              </div>
              <div className="flex justify-between py-1 px-2 bg-[#0B0D13] rounded border border-[#1E2538]">
                <span className="text-slate-400">earFlatten:</span>
                <span className="text-slate-200 tabular-nums">
                  {blendshapes.earFlatten.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 px-2 bg-[#0B0D13] rounded border border-[#1E2538]">
                <span className="text-slate-400">eyesSquint:</span>
                <span className="text-slate-200 tabular-nums">
                  {blendshapes.eyesSquint.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 px-2 bg-[#0B0D13] rounded border border-[#1E2538]">
                <span className="text-slate-400">tailSwishSpeed / Flick:</span>
                <span className="text-slate-200 tabular-nums">
                  {blendshapes.tailSwishSpeed.toFixed(1)}x / {blendshapes.tailFlickIntensity.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 px-2 bg-[#0B0D13] rounded border border-[#1E2538]">
                <span className="text-slate-400">breathingRate / PurrVib:</span>
                <span className="text-slate-200 tabular-nums">
                  {blendshapes.breathingRate.toFixed(2)}x / {blendshapes.purrVibration.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Manual Emotion Command Dispatcher */}
            <div className="mt-3">
              <span className="text-[10px] text-slate-400 mb-1.5 block">
                Dispatch Manual Emotion Override:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {emotions.map(e => (
                  <button
                    key={e}
                    onClick={() => onTriggerEmotion(e)}
                    className={`py-1 px-1.5 rounded text-[10px] font-medium capitalize transition-all border ${
                      emotion.type === e
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-[#0B0D13] text-slate-300 border-[#1E2538] hover:text-white hover:bg-[#161B28]'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Latest Segment & Semantic Extraction */}
          <section className="p-3 bg-[#131722] border border-[#232B3E] rounded-xl shadow-sm">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              Latest Segment Summarization
            </span>

            {latestSegment ? (
              <div className="space-y-2 text-[10px]">
                <div className="p-2 bg-[#0B0D13] rounded border border-[#1E2538]">
                  <span className="text-slate-400 block mb-0.5">Summary:</span>
                  <span className="text-slate-200 font-sans">{latestSegment.summary}</span>
                </div>
                <div className="p-2 bg-[#0B0D13] rounded border border-[#1E2538]">
                  <span className="text-slate-400 block mb-0.5">Extracted Keywords:</span>
                  <span className="text-amber-300">[{latestSegment.keywords.join(', ')}]</span>
                </div>
                <div className="p-2 bg-[#0B0D13] rounded border border-[#1E2538]">
                  <span className="text-slate-400 block mb-0.5">Segment Tone Vector:</span>
                  <span className="text-emerald-400">
                    dominant: {latestSegment.tone.dominant} | val: {latestSegment.tone.valence.toFixed(2)} | aro: {latestSegment.tone.arousal.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-center py-4">
                Send a message to view live segment extraction logs.
              </div>
            )}
          </section>
        </div>
      ) : activeTab === 'logs' ? (
        /* Tab 2: Server Logs Inspector */
        <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              Live Server Output & Error Stream ({serverLogs.length})
            </span>
            <button
              onClick={fetchLogs}
              disabled={isLoadingLogs}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-[#1E2538] hover:bg-[#2A344D] text-slate-200 rounded border border-[#232B3E] transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] pr-1">
            {serverLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                No logs recorded yet.
              </div>
            ) : (
              serverLogs.map(log => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-lg border leading-relaxed ${
                    log.level === 'error'
                      ? 'bg-red-950/30 border-red-800/60 text-red-200'
                      : log.level === 'warn'
                      ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                      : 'bg-[#131722] border-[#232B3E] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 text-[10px]">
                    <span className="flex items-center gap-1.5 font-bold uppercase">
                      {log.level === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
                      {log.level === 'warn' && <AlertCircle className="w-3 h-3 text-amber-400" />}
                      {log.level === 'info' && <Info className="w-3 h-3 text-blue-400" />}
                      <span
                        className={
                          log.level === 'error'
                            ? 'text-red-400 font-bold'
                            : log.level === 'warn'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }
                      >
                        [{log.level}]
                      </span>
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-100">{log.message}</p>

                  {log.details && (
                    <pre className="mt-1.5 p-1.5 bg-black/40 rounded text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Tab 3: Embedded Knowledge Graph */
        <div className="flex-1 w-full h-full overflow-hidden">
          <KnowledgeGraphCanvas segments={segments} />
        </div>
      )}
    </div>
  );
};
