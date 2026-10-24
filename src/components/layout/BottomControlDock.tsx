import React, { useState } from 'react';
import { EmotionType, CoatStyle, EmotionState } from '../../types/avatar';
import { ChevronDown, ChevronUp, Palette, Smile, Brain, Sparkles } from 'lucide-react';

interface Props {
  currentEmotion: EmotionState;
  onTriggerEmotion: (emotion: EmotionType) => void;
  coatStyle: CoatStyle;
  onSelectCoat: (coat: CoatStyle) => void;
  showGraph: boolean;
  onToggleGraph: () => void;
}

export const BottomControlDock: React.FC<Props> = ({
  currentEmotion,
  onTriggerEmotion,
  coatStyle,
  onSelectCoat,
  showGraph,
  onToggleGraph
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'emotions' | 'coat'>('emotions');

  const emotions: Array<{ type: EmotionType; label: string; icon: string }> = [
    { type: 'happy', label: 'Happy', icon: '😸' },
    { type: 'curious', label: 'Curious', icon: '🧐' },
    { type: 'affectionate', label: 'Affectionate', icon: '😻' },
    { type: 'thoughtful', label: 'Thoughtful', icon: '🤔' },
    { type: 'sassy', label: 'Sassy', icon: '😼' },
    { type: 'empathetic', label: 'Empathetic', icon: '🥺' },
    { type: 'surprised', label: 'Surprised', icon: '🙀' },
    { type: 'calm', label: 'Calm', icon: '😌' }
  ];

  const coats: Array<{ id: CoatStyle; label: string; hex: string }> = [
    { id: 'jiji', label: 'Jiji (Ghibli)', hex: '#0D0E14' },
    { id: 'tabby', label: 'Ginger Tabby', hex: '#EA8A28' },
    { id: 'tuxedo', label: 'Tuxedo', hex: '#181A20' },
    { id: 'calico', label: 'Calico', hex: '#D97706' },
    { id: 'siamese', label: 'Siamese', hex: '#F3E8DC' },
    { id: 'black', label: 'Midnight Black', hex: '#111318' },
    { id: 'white', label: 'Snow White', hex: '#F8FAFC' }
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto transition-transform duration-300">
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(c => !c)}
        className="flex items-center gap-1.5 px-3 py-1 bg-[#131722]/90 hover:bg-[#1C2234] border border-[#232B3E] text-[11px] font-medium text-slate-300 hover:text-white rounded-t-lg backdrop-blur-md shadow-md mb-[-1px] transition-colors"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Show Avatar Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Hide Controls</span>
          </>
        )}
      </button>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="flex flex-col sm:flex-row items-center gap-3 p-2 bg-[#131722]/90 border border-[#232B3E] rounded-2xl backdrop-blur-xl shadow-2xl max-w-[94vw]">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-[#0B0D13] rounded-xl border border-[#232B3E]">
            <button
              onClick={() => setActiveTab('emotions')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'emotions'
                  ? 'bg-[#1E2538] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              <span>Emotions</span>
            </button>
            <button
              onClick={() => setActiveTab('coat')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'coat'
                  ? 'bg-[#1E2538] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              <span>Fur Coat</span>
            </button>
          </div>

          <div className="h-5 w-[1px] bg-[#232B3E] hidden sm:block" />

          {/* Tab Content 1: Emotion Quick Triggers */}
          {activeTab === 'emotions' ? (
            <div className="flex items-center gap-1 overflow-x-auto max-w-[420px] p-0.5">
              {emotions.map(e => (
                <button
                  key={e.type}
                  onClick={() => onTriggerEmotion(e.type)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    currentEmotion.type === e.type
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md scale-105'
                      : 'bg-[#181D2B] hover:bg-[#20273A] text-slate-300 hover:text-white border border-[#232B3E]'
                  }`}
                >
                  <span>{e.icon}</span>
                  <span className="hidden md:inline">{e.label}</span>
                </button>
              ))}
            </div>
          ) : (
            /* Tab Content 2: Coat Swatches */
            <div className="flex items-center gap-1.5 overflow-x-auto p-0.5">
              {coats.map(c => (
                <button
                  key={c.id}
                  onClick={() => onSelectCoat(c.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    coatStyle === c.id
                      ? 'bg-[#20273A] border-amber-400 text-white shadow-sm scale-105'
                      : 'bg-[#181D2B] border-[#232B3E] text-slate-300 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="h-5 w-[1px] bg-[#232B3E] hidden sm:block" />

          {/* Toggle Knowledge Graph Drawer */}
          <button
            onClick={onToggleGraph}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
              showGraph
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-[#181D2B] border-[#232B3E] text-slate-300 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>{showGraph ? 'Hide Graph' : 'Memory Graph'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
