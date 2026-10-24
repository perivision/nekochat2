import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-Memory Server Log Buffer (Last 100 entries)
export interface ServerLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}

const serverLogs: ServerLogEntry[] = [
  {
    id: `log-${Date.now()}-init`,
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Chatbot Cat server initialized on port ' + PORT,
    details: { envGeminiKeyPresent: !!process.env.GEMINI_API_KEY }
  }
];

export function logServer(level: 'info' | 'warn' | 'error', message: string, details?: any) {
  const entry: ServerLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    details
  };
  serverLogs.push(entry);
  if (serverLogs.length > 100) {
    serverLogs.shift();
  }

  if (level === 'error') {
    console.error(`[SERVER ERROR ${entry.timestamp}] ${message}`, details || '');
  } else if (level === 'warn') {
    console.warn(`[SERVER WARN ${entry.timestamp}] ${message}`, details || '');
  } else {
    console.log(`[SERVER INFO ${entry.timestamp}] ${message}`);
  }
}

// Initialize GoogleGenAI SDK on server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
    timeout: 15000, // Minimum allowed deadline by Google API is 10s
  },
});

// GET /api/logs: Expose server logs for debugging
app.get('/api/logs', (_req, res) => {
  const lastError = serverLogs.find(l => l.level === 'error');
  const isDepleted = lastError?.message?.includes('402') || lastError?.message?.includes('depleted');

  res.json({
    total: serverLogs.length,
    keyStatus: isDepleted ? 'credits_depleted' : 'connected',
    logs: serverLogs.slice().reverse(), // Latest first
  });
});

// POST /api/chat: Feline Chat & Memory Segment Summarization
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  const { message, conversationHistory = [], activePersona, relevantMemories = '' } = req.body;

  if (!message || typeof message !== 'string') {
    logServer('warn', 'Chat request rejected: empty or missing message');
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const personaName = activePersona?.name || 'Jiji';
  const personaRole = activePersona?.role || "Kiki's Loyal Familiar";
  const personaPrompt = activePersona?.systemPrompt || 'You are Jiji, a witty, loyal domestic cat.';

  logServer('info', `Incoming message from user: "${message.slice(0, 60)}"`, {
    persona: personaName,
    messageLength: message.length,
    hasPastMemories: !!relevantMemories
  });

  // Construct Contextual Prompt with Long-Term Memories
  let memoryContext = '';
  if (relevantMemories && relevantMemories.trim()) {
    memoryContext = `\nRELEVANT PAST MEMORIES RECALLED FROM YOUR KNOWLEDGE GRAPH:\n${relevantMemories}\nUse this past knowledge naturally if relevant to personalize your response (e.g., "Like when you mentioned...").`;
  }

  const systemInstruction = `${personaPrompt}
Your name is ${personaName}, role: ${personaRole}.${memoryContext}

Always respond in a JSON object adhering to this schema:
- avatarResponse: Your conversational spoken response as ${personaName} (2-4 sentences, including lively physical gestures like *perks tall ears*, *flicks sleek tail*, *tilts head with a smirk*).
- summary: A crisp 1-sentence summary of what the user discussed or shared in this segment.
- keywords: 3 to 5 core topical keywords or entities from this turn.
- tone: An object containing:
    dominant: one of "happy", "curious", "affectionate", "thoughtful", "sassy", "empathetic", "surprised", "calm"
    valence: number from -1.0 to 1.0 (emotional positivity)
    arousal: number from 0.0 to 1.0 (energy level)
- extractedGraphTriplets: an array of objects { subject: string, relation: string, object: string } representing new knowledge discovered in this turn.`;

  // Format chat contents
  const contents: any[] = [];
  if (Array.isArray(conversationHistory)) {
    for (const turn of conversationHistory.slice(-8)) {
      contents.push({
        role: turn.role === 'model' || turn.role === 'cat' ? 'model' : 'user',
        parts: [{ text: turn.content }],
      });
    }
  }
  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  try {
    // 15 second timeout safeguard
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API request timed out after 15000ms')), 15000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.85,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            avatarResponse: {
              type: Type.STRING,
              description: 'The verbal conversational reply from the cat persona',
            },
            summary: {
              type: Type.STRING,
              description: 'Concise 1-sentence summary of the conversation segment',
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-5 semantic keywords extracted from this segment',
            },
            tone: {
              type: Type.OBJECT,
              properties: {
                dominant: {
                  type: Type.STRING,
                  description: 'Dominant emotion: happy, curious, affectionate, thoughtful, sassy, empathetic, surprised, or calm',
                },
                valence: {
                  type: Type.NUMBER,
                  description: 'Valence between -1.0 and 1.0',
                },
                arousal: {
                  type: Type.NUMBER,
                  description: 'Arousal between 0.0 and 1.0',
                },
              },
              required: ['dominant', 'valence', 'arousal'],
            },
            extractedGraphTriplets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  relation: { type: Type.STRING },
                  object: { type: Type.STRING },
                },
                required: ['subject', 'relation', 'object'],
              },
            },
          },
          required: ['avatarResponse', 'summary', 'keywords', 'tone', 'extractedGraphTriplets'],
        },
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const duration = Date.now() - startTime;

    const rawText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        avatarResponse: rawText,
        summary: message.slice(0, 80),
        keywords: ['chat', 'companion'],
        tone: { dominant: 'calm', valence: 0.2, arousal: 0.3 },
        extractedGraphTriplets: [],
      };
    }

    logServer('info', `Gemini 3.8 Flash responded successfully in ${duration}ms`, {
      tone: parsed.tone?.dominant,
      valence: parsed.tone?.valence,
      keywordsCount: parsed.keywords?.length
    });

    res.json(parsed);
  } catch (err: any) {
    const duration = Date.now() - startTime;
    const errorMessage = err?.message || String(err);
    const errorStatus = err?.status || (errorMessage.includes('timed out') ? 504 : 500);

    logServer('error', `Gemini API call failed after ${duration}ms: ${errorMessage}`, {
      status: errorStatus,
      durationMs: duration,
      errorStack: err?.stack?.slice(0, 200)
    });

    // Smart persona-aware contextual fallback response
    const fallbackResponse = personaName === 'Jiji'
      ? `*perks tall ears and flicks tail playfully* Well, look who's talking! I'm right here listening to you with every twitch of my whiskers. What's our next big adventure?`
      : `*slowly blinks and rests paw gently* I hear you softly. Even when thoughts get quiet, I'm right here resting by your side.`;

    res.json({
      avatarResponse: fallbackResponse,
      summary: message.slice(0, 60),
      keywords: ['chat', 'companionship'],
      tone: { dominant: personaName === 'Jiji' ? 'sassy' : 'empathetic', valence: 0.6, arousal: 0.4 },
      extractedGraphTriplets: [
        { subject: 'User', relation: 'confides_in', object: personaName }
      ]
    });
  }
});

// Setup Vite in Dev or static files in Production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logServer('info', `Chatbot Cat Express server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
