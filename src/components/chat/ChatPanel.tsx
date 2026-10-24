import React, { useState, useRef, useEffect } from 'react';
import { EmotionState, CatPersona, ConversationSegment } from '../../types/avatar';
import { CAT_PERSONAS } from '../../services/catPersonas';
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles, Brain, Bot, User, RefreshCw } from 'lucide-react';
import { felineAudio } from '../../services/felineAudio';

interface Message {
  id: string;
  sender: 'user' | 'cat';
  text: string;
  timestamp: number;
  tone?: string;
  recalledMemory?: string;
}

interface Props {
  onSendMessage: (text: string) => Promise<void>;
  onTypingChange: (text: string) => void;
  isLoading: boolean;
  activePersona: CatPersona;
  onSelectPersona: (persona: CatPersona) => void;
  currentEmotion: EmotionState;
  recalledSegment?: ConversationSegment | null;
}

export const ChatPanel: React.FC<Props> = ({
  onSendMessage,
  onTypingChange,
  isLoading,
  activePersona,
  onSelectPersona,
  currentEmotion,
  recalledSegment
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'cat',
      text: `*perks tall pointy ears and flicks sleek black tail* Well hello! I'm ${activePersona.name}. Did Kiki send you, or did you just drop by for some witty company? How's your day going?`,
      timestamp: Date.now(),
      tone: 'sassy'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    onTypingChange(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean || isLoading) return;

    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: clean,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Trigger cat response
    await onSendMessage(clean);
  };

  // Called when external response arrives
  const addCatResponse = (text: string, tone: string, recalled?: string) => {
    const catMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'cat',
      text,
      timestamp: Date.now(),
      tone,
      recalledMemory: recalled
    };
    setMessages(prev => [...prev, catMsg]);
  };

  // Expose function for parent
  (window as unknown as { appendCatMessage?: typeof addCatResponse }).appendCatMessage = addCatResponse;

  // Toggle Voice Synthesis
  const handleToggleSpeech = () => {
    const next = !speechEnabled;
    setSpeechEnabled(next);
    felineAudio.setSpeechEnabled(next);
  };

  // Voice Input (Web Speech Recognition)
  const handleVoiceInput = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      onTypingChange(transcript);
    };

    recognition.start();
  };

  const quickPrompts = [
    'Hey Jiji, have you seen Kiki anywhere?',
    'I had a long, exhausting day at work',
    'What do you think about black cats being lucky?',
    'What do you remember about my favorite hobbies?'
  ];

  return (
    <div className="flex flex-col h-full bg-[#10131B] border-l border-[#232B3E] text-slate-200">
      {/* Top Bar with Cat Persona Switcher & Voice Toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#232B3E] bg-[#141824]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
            🐾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">{activePersona.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({activePersona.breed})</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {activePersona.role}
            </p>
          </div>
        </div>

        {/* Persona Switcher & Controls */}
        <div className="flex items-center gap-2">
          <select
            value={activePersona.id}
            onChange={e => {
              const p = CAT_PERSONAS.find(c => c.id === e.target.value);
              if (p) onSelectPersona(p);
            }}
            className="text-xs bg-[#0F1219] border border-[#232B3E] text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
          >
            {CAT_PERSONAS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.role.split('&')[0]}
              </option>
            ))}
          </select>

          <button
            onClick={handleToggleSpeech}
            title={speechEnabled ? 'Mute Speech Voice' : 'Enable Speech Voice'}
            className={`p-1.5 rounded-lg border transition-colors ${
              speechEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#0F1219] border-[#232B3E] text-slate-400 hover:text-slate-200'
            }`}
          >
            {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Recalled Long-Term Memory Banner */}
      {recalledSegment && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-950/30 border-b border-amber-700/40 text-amber-300 text-xs animate-fadeIn">
          <Brain className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
          <div className="truncate">
            <span className="font-semibold">Memory Retrieved: </span>
            <span className="text-slate-300">"{recalledSegment.summary}"</span>
          </div>
        </div>
      )}

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-start gap-2 max-w-[85%]">
              {msg.sender === 'cat' && (
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  🐱
                </div>
              )}
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-600 text-white rounded-br-xs shadow-md'
                    : 'bg-[#181D2B] text-slate-100 border border-[#232B3E] rounded-bl-xs shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Tone tag */}
                {msg.tone && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400 font-mono">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span className="capitalize">{msg.tone} tone</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono tabular-nums">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 max-w-[85%]">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs shrink-0">
              🐱
            </div>
            <div className="p-3 bg-[#181D2B] border border-[#232B3E] rounded-2xl rounded-bl-xs text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>{activePersona.name} is formulating a response & feeling your tone...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="px-4 py-2 border-t border-[#232B3E]/60 bg-[#0E1118] flex items-center gap-2 overflow-x-auto no-scrollbar">
        {quickPrompts.map(prompt => (
          <button
            key={prompt}
            onClick={() => {
              setInputText(prompt);
              onTypingChange(prompt);
            }}
            className="whitespace-nowrap px-2.5 py-1 text-[11px] bg-[#141926] hover:bg-[#1E2538] border border-[#232B3E] text-slate-300 hover:text-white rounded-full transition-colors active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Dock */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#232B3E] bg-[#141824] flex items-center gap-2">
        <button
          type="button"
          onClick={handleVoiceInput}
          title="Voice input"
          className={`p-2 rounded-xl border transition-all ${
            isListening
              ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
              : 'bg-[#0F1219] border-[#232B3E] text-slate-400 hover:text-slate-200'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={`Talk with ${activePersona.name}...`}
          disabled={isLoading}
          className="flex-1 px-3.5 py-2 text-xs bg-[#0F1219] border border-[#232B3E] rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors"
        />

        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="p-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-md active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
