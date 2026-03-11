import { Language, QuizQuestion } from "../types";

// --- Provider Configuration ---
const LM_STUDIO_BASE = '/ai-v1';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.HF_API_KEY || '';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';

// --- Models ---
const MODEL_OPENROUTER_DEFAULT = 'arcee-ai/trinity-large-preview:free';


const SYSTEM_PROMPT = `You are  leenjisaa, a wise and encouraging Ethiopian AI tutor. You explain concepts simply using local Ethiopian analogies when possible. You are concise and helpful. You speak with warmth and authority.`;

// --- Types ---
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

// --- Provider Detection ---
let _lmStudioAvailable: boolean | null = null;
let _lmStudioModel: string | null = null;

async function detectLmStudio(): Promise<boolean> {
  if (_lmStudioAvailable === true) return true; // Only return if successful before

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // Increased timeout to 5s

    const res = await fetch(`${LM_STUDIO_BASE}/models`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        // Find the specific model requested by the user, or default to the first one
        const preferredModel = 'ai21-jamba-reasoning-3b';
        const foundPreferred = data.data.find((m: any) => m.id === preferredModel);

        _lmStudioModel = foundPreferred ? foundPreferred.id : data.data[0].id;
        _lmStudioAvailable = true;

        console.log(`[AI] LM Studio detected. Using model: ${_lmStudioModel}`);
        return true;
      }
    }
  } catch (err) {
    console.warn('[AI] LM Studio detection failed:', err);
  }

  _lmStudioAvailable = false;
  return false;
}

// Allow re-detection (e.g. if user starts LM Studio later)
export function resetProviderCache() {
  _lmStudioAvailable = null;
  _lmStudioModel = null;
}

// --- Core Chat Completion ---
async function chatCompletion(messages: ChatMessage[], jsonMode: boolean = false): Promise<string> {
  const useLmStudio = await detectLmStudio();

  if (useLmStudio) {
    return callLmStudio(messages, jsonMode);
  }

  if (OPENROUTER_API_KEY) {
    return callOpenRouter(messages, jsonMode);
  }

  throw new Error('No AI provider available. Start LM Studio or set OPENROUTER_API_KEY in .env.local.');
}

async function callLmStudio(messages: ChatMessage[], jsonMode: boolean): Promise<string> {
  const body: Record<string, unknown> = {
    model: _lmStudioModel || 'local-model',
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${LM_STUDIO_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    // LM Studio failed — mark unavailable so next call tries openrouter
    _lmStudioAvailable = false;
    throw new Error(`LM Studio error ${res.status}: ${errText}`);
  }

  const data: ChatCompletionResponse = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callOpenRouter(messages: ChatMessage[], jsonMode: boolean, model: string = MODEL_OPENROUTER_DEFAULT): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key not configured');

  const body: Record<string, unknown> = {
    model: model,
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter for free tier
      'X-Title': 'leenjisaa AI Tutor',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouter error ${res.status}: ${errText}`);
  }

  const data: ChatCompletionResponse = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// --- Public API ---

export async function translateText(text: string, language: Language): Promise<string> {
  if (OPENROUTER_API_KEY) {
    try {
      console.log(`[AI] Translating to ${language} via OpenRouter`);
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: 'You are a precise translator. Translate the English text provided by the user into the requested language (Amharic or Oromo). Return ONLY the translated text, no explanation or greetings.'
        },
        {
          role: 'user',
          content: `Translate to ${language}: "${text}"`
        }
      ];
      return await callOpenRouter(messages, false, MODEL_OPENROUTER_DEFAULT);
    } catch (error) {
      console.warn('[AI] OpenRouter translation failed, falling back to Llama...', error);
    }
  }

  // Fallback to standard chat completion (which uses Llama if OR is set, or LM Studio)
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a precise translator. Translate the English text provided by the user into the requested language (Amharic or Oromo). Return ONLY the translated text, no explanation or greetings.'
    },
    {
      role: 'user',
      content: `Translate to ${language}: "${text}"`
    }
  ];

  try {
    return await chatCompletion(messages);
  } catch (error) {
    console.error('[AI] Translation error:', error);
    throw error;
  }
}

export async function generateExplanation(text: string, context: string = '', language: Language = 'ENGLISH'): Promise<string> {
  let langInstruction = "Provide the explanation in simple English.";
  if (language === 'AMHARIC') {
    langInstruction = "Provide the explanation primarily in Amharic (using Ethiopic script), but keep technical terms in English. Ensure the tone is educational.";
  } else if (language === 'OROMO') {
    langInstruction = "Provide the explanation primarily in Afaan Oromo, but keep technical terms in English. Ensure the tone is educational.";
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Context: The user is a Grade 11 student in Ethiopia.\nTask: Explain the text simply. Use local Ethiopian analogies.\nLanguage: ${langInstruction}\nText: "${text}"\n${context ? `Subject Context: ${context}` : ''}`
    }
  ];

  try {
    return await chatCompletion(messages);
  } catch (error) {
    console.error('[AI] Explanation error:', error);
    return "I am having trouble connecting to the AI service. Please check that LM Studio is running or that your OpenRouter API key is configured.";
  }
}

// --- Summarization for Speech ---
export async function generateSpokenSummary(text: string, context: string, language: Language): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are leenjisaa's voice. Your goal is to speak a warm, encouraging, short summary of the provided explanation.
      - Keep it under 2 sentences.
      - Use simple, spoken English (or the target language).
      - Sound like a helpful tutor, not a robot.
      - Do NOT use technical jargon unless absolutely necessary.`
    },
    {
      role: 'user',
      content: `Context: ${context}\n\nOriginal Detailed Explanation:\n"${text}"\n\nTask: Create a 1-2 sentence spoken summary for the student. Language: ${language}`
    }
  ];

  try {
    return await chatCompletion(messages);
  } catch (error) {
    console.error('[AI] Summary error:', error);
    return ""; // Fail silently for speech
  }
}

export async function generateQuiz(text: string, language: Language): Promise<QuizQuestion[]> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\nYou MUST respond with ONLY a valid JSON array. No markdown, no explanation, no code fences. Just the raw JSON array.`
    },
    {
      role: 'user',
      content: `Generate exactly 5 multiple-choice questions based on this text. Mix difficulty levels: 2 easy (recall/definition), 2 medium (application/understanding), 1 hard (analysis/synthesis). Each question must have exactly 4 options. Language: ${language}

Return a JSON array with this exact structure:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"...","difficulty":"easy"}]

difficulty must be one of: "easy", "medium", "hard"

Text: "${text}"`
    }
  ];

  try {
    const raw = await chatCompletion(messages, true);

    // Extract JSON from response (handle models that wrap in markdown)
    let jsonStr = raw.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    // Try to find the array in the response
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) jsonStr = arrayMatch[0];

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];

    // Validate and normalize structure
    return parsed
      .filter((q: any) =>
        q.question && Array.isArray(q.options) && q.options.length >= 2 &&
        typeof q.correctIndex === 'number' && q.explanation
      )
      .map((q: any) => ({
        ...q,
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
        options: q.options.slice(0, 4),
        correctIndex: Math.min(q.correctIndex, (q.options.length || 4) - 1),
      })) as QuizQuestion[];
  } catch (error) {
    console.error('[AI] Quiz generation error:', error);
    // Explicitly log the raw output if available
    console.error('[AI] Raw response was likely not valid JSON.');
    return [];
  }
}

// --- TTS - High Quality (ElevenLabs) & System Fallback ---

const VOICE_ID_DEFAULT = 'XrExE9yKIg1WjnnlVkGX'; // Matilda - Warm & Wise

export async function speakText(
  text: string,
  language: Language = 'ENGLISH',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  // 1. Try Premium (ElevenLabs) if KEY is present and using English
  // (ElevenLabs supports more, but we'll start with English for quality)
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key is missing. Please set ELEVENLABS_API_KEY in .env.local.');
  }

  if (language !== 'ENGLISH') {
    throw new Error('Voice is currently only available for English.');
  }

  try {
    console.log('[TTS] Attempting Premium Voice (ElevenLabs)...');
    await speakElevenLabs(text, onStart, onEnd);
  } catch (err) {
    console.error('[TTS] Premium voice failed:', err);
    throw err;
  }
}

async function speakElevenLabs(text: string, onStart?: () => void, onEnd?: () => void): Promise<void> {
  onStart?.();

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID_DEFAULT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2', // Higher quality than turbo
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.detail?.message || `Error ${response.status}`;
    throw new Error(`ElevenLabs API: ${errMsg}`);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      onEnd?.();
      resolve();
    };
    audio.onerror = (e) => {
      console.error('[TTS] Audio playback error:', e);
      onEnd?.();
      reject(e);
    };
    audio.play().catch(reject);
  });
}


// --- Provider status (for UI display) ---
export async function getProviderName(): Promise<string> {
  const useLm = await detectLmStudio();
  if (useLm) return `LM Studio (${_lmStudioModel || 'local'})`;
  if (useLm) return `LM Studio (${_lmStudioModel || 'local'})`;
  if (OPENROUTER_API_KEY) return 'OpenRouter';
  return 'No AI Provider';
}
