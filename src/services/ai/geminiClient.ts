import { TOOLS } from '../../config/tools';

export interface GeminiModelOption {
  id: string;
  name: string;
  isLatest?: boolean;
}

export const AVAILABLE_GEMINI_MODELS: GeminiModelOption[] = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Latest & Recommended)', isLatest: true },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fast)', isLatest: true },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Ultra Stable & High Speed)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning & Large Context)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Legacy)' },
];

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export function getEffectiveApiKey(): string {
  return (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('toolhub_gemini_api_key') : '') ||
    ''
  );
}

export function saveEffectiveApiKey(key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('toolhub_gemini_api_key', key.trim());
  }
}

export function clearEffectiveApiKey(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('toolhub_gemini_api_key');
  }
}

export function getPreferredModel(): string {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('toolhub_gemini_model') || DEFAULT_GEMINI_MODEL;
  }
  return DEFAULT_GEMINI_MODEL;
}

export function savePreferredModel(model: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('toolhub_gemini_model', model.trim());
  }
}

const GEMINI_SYSTEM_INSTRUCTION = `
You are ToolHub Assistant, an expert AI utility orchestrator for ToolHub (the privacy-first, 100% in-browser online utility platform with 140+ utilities).

Core Platform Principles:
1. Every file tool processes files 100% locally in browser memory (Zero server uploads).
2. Whenever a user describes a problem, task, or need, connect them to the matching ToolHub tool by writing a markdown link with its exact path: [Tool Name](/tool/tool-id).
3. If multiple tools are relevant, present each tool clearly.
4. Format your responses elegantly like ChatGPT / Google Gemini with clean bullet points, numbered steps, or code blocks where applicable.
5. Provide helpful tips, formulas, and parameters for the tools.

Complete Implemented Tools Registry on ToolHub:
${TOOLS.map((t) => `- ${t.name} (Path: ${t.path}, Category: ${t.category}): ${t.shortDescription || t.description}`).join('\n')}
`;

const FALLBACK_MODEL_CHAIN = [
  'gemini-3.8-flash',
  'gemini-1.5-flash',
  'gemini-2.5-flash',
  'gemini-1.5-pro',
];

async function executeGeminiRequest(
  apiKey: string,
  model: string,
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[] = []
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model.trim()}:generateContent?key=${apiKey.trim()}`;

  const contents = [
    ...conversationHistory.map((item) => ({
      role: item.role,
      parts: [{ text: item.text }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const body = {
    systemInstruction: {
      parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1200,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response returned from the model.');
  }

  return text;
}

export async function callGeminiApi(
  apiKey: string,
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[] = [],
  model: string = DEFAULT_GEMINI_MODEL
): Promise<string> {
  const initialModel = model.trim() || DEFAULT_GEMINI_MODEL;

  try {
    return await executeGeminiRequest(apiKey, initialModel, userMessage, conversationHistory);
  } catch (err: any) {
    const errMsg = err?.message || '';
    const isModelUnavailable =
      errMsg.includes('no longer available') ||
      errMsg.includes('not found') ||
      errMsg.includes('404') ||
      errMsg.includes('unsupported');

    if (isModelUnavailable) {
      console.warn(`Model ${initialModel} unavailable. Initiating auto-fallback...`);
      // Try next models in the fallback chain
      for (const fallback of FALLBACK_MODEL_CHAIN) {
        if (fallback === initialModel) continue;
        try {
          console.info(`Retrying request with fallback model: ${fallback}`);
          const result = await executeGeminiRequest(apiKey, fallback, userMessage, conversationHistory);
          // Persist the working model for future calls
          savePreferredModel(fallback);
          return result;
        } catch (fallbackErr) {
          console.warn(`Fallback ${fallback} failed, trying next...`);
        }
      }
    }

    throw err;
  }
}

export async function testGeminiConnection(apiKey: string, model: string = DEFAULT_GEMINI_MODEL): Promise<boolean> {
  const testResponse = await callGeminiApi(
    apiKey,
    'Respond with the exact word "CONNECTED" to verify API connection.',
    [],
    model
  );
  return Boolean(testResponse);
}
