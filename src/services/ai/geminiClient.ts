import { TOOLS } from '../../config/tools';

export interface GeminiModelOption {
  id: string;
  name: string;
  isLatest?: boolean;
}

export const AVAILABLE_GEMINI_MODELS: GeminiModelOption[] = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Latest & Fast)', isLatest: true },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite (Ultra Fast)', isLatest: true },
  { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro Exp (Complex Reasoning)', isLatest: true },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Standard)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (High Context)' },
];

export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

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

const GEMINI_SYSTEM_INSTRUCTION = `
You are ToolHub Assistant, a smart, concise AI assistant for ToolHub (an all-in-one privacy-first online utility platform).
ToolHub contains 140+ utilities spanning PDF editing, image conversion, developer utilities, academic calculators, and file converters.

Core Platform Principles:
1. All file tools process files 100% locally in browser memory (zero server transmission).
2. Recommend the exact ToolHub tool with its URL path when relevant (e.g. [Tool Name](/tool/tool-id)).
3. Keep answers clean, direct, and actionable.

Key Implemented Tools on ToolHub:
${TOOLS.slice(0, 60).map((t) => `- ${t.name} (Path: ${t.path}): ${t.shortDescription || t.description}`).join('\n')}
...and 80+ other tools.
`;

export async function callGeminiApi(
  apiKey: string,
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[] = [],
  model: string = DEFAULT_GEMINI_MODEL
): Promise<string> {
  const chosenModel = model.trim() || DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey.trim()}`;

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
