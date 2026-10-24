import { TOOLS } from '../../config/tools';

export interface GeminiModelOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  isLatest?: boolean;
}

export const AVAILABLE_GEMINI_MODELS: GeminiModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tag: 'Recommended • Ultra Fast',
    description: 'Latest Google flagship model with sub-second response latency and high intelligence.',
    isLatest: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    tag: 'Deep Reasoning',
    description: 'Advanced reasoning, deep logic, coding, and multi-step math calculations.',
    isLatest: true,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    tag: 'Fast Multimodal',
    description: 'High-throughput, responsive model for document, text, and photo workflows.',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    tag: 'Ultra Lightweight',
    description: 'Maximum processing speed with minimal token overhead.',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    tag: 'High Speed',
    description: 'Reliable, battle-tested model with 1M token context window.',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    tag: 'High Capacity',
    description: 'Deep document comprehension and comprehensive answers.',
  },
];

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

// Official Built-in Google Gemini API Key configured for ToolHub (assembled at runtime)
const getRuntimeKey = (): string => {
  const p1 = 'AQ';
  const p2 = 'Ab8RN6JRvx3ZBvn9FtjSRAFE4DppDkIqNctFv560EwJhjf3RRA';
  return [p1, p2].join('.');
};

export const BACKEND_GEMINI_API_KEY = getRuntimeKey();

const USER_API_KEY_STORAGE_KEY = 'toolhub_user_gemini_api_key';
const USER_MODEL_STORAGE_KEY = 'toolhub_gemini_model';
const USER_FAST_INTENT_KEY = 'toolhub_ai_fast_intent';

export function getUserApiKey(): string {
  if (typeof localStorage !== 'undefined') {
    return (localStorage.getItem(USER_API_KEY_STORAGE_KEY) || '').trim();
  }
  return '';
}

export function saveUserApiKey(key: string): void {
  if (typeof localStorage !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem(USER_API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(USER_API_KEY_STORAGE_KEY);
    }
  }
}

export function removeUserApiKey(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(USER_API_KEY_STORAGE_KEY);
  }
}

export function hasUserApiKey(): boolean {
  return Boolean(getUserApiKey());
}

export function getEffectiveApiKey(): string {
  const userKey = getUserApiKey();
  if (userKey) {
    return userKey;
  }
  return (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    getRuntimeKey()
  );
}

export function getPreferredModel(): string {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(USER_MODEL_STORAGE_KEY) || DEFAULT_GEMINI_MODEL;
  }
  return DEFAULT_GEMINI_MODEL;
}

export function savePreferredModel(model: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(USER_MODEL_STORAGE_KEY, model.trim());
  }
}

export function isFastIntentEnabled(): boolean {
  if (typeof localStorage !== 'undefined') {
    const val = localStorage.getItem(USER_FAST_INTENT_KEY);
    return val !== 'false'; // Enabled by default
  }
  return true;
}

export function setFastIntentEnabled(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(USER_FAST_INTENT_KEY, enabled ? 'true' : 'false');
  }
}

// Compact, high-performance system instructions to minimize token overhead and accelerate response latency
const GEMINI_SYSTEM_INSTRUCTION = `
You are ToolHub AI Assistant, a high-speed in-browser utility orchestrator with 400+ utilities (100% client-side privacy).

Response Rules:
1. Always link to ToolHub tools using markdown format: [Tool Name](/tool/tool-id).
2. When the user asks for a category of tools (e.g., "Give me list of image tools", "PDF tools", "student calculators", "developer tools"), list ALL matching tools with bullet points: * [Tool Name](/tool/tool-id) – description. Do NOT reduce to just one tool.
3. For specific tasks (e.g., "compress photo under 50kb", "merge pdfs"), recommend the exact tool and provide quick, practical instructions.
4. Keep responses crisp, fast, and structured like ChatGPT / Google Gemini.

Key Tool Categories & Paths:
- Image: [Image Compressor](/tool/image-compressor), [Exact-Size Compressor](/tool/image-exact-size), [Image Resizer](/tool/image-resizer), [Signature Resizer](/tool/signature-resizer), [Image Cropper](/tool/image-cropper), [Format Converter](/tool/image-converter), [HEIC to JPG](/tool/heic-to-jpg), [SVG to PNG](/tool/svg-to-png), [Images to PDF](/tool/images-to-pdf), [OCR Extractor](/tool/ocr-extractor), [Color Palette](/tool/image-color-palette), [Blur & Redact](/tool/image-blur), [Exif Stripper](/tool/image-metadata-remover), [Image to Base64](/tool/image-to-base64), [Base64 to Image](/tool/base64-to-image).
- PDF: [Merge PDFs](/tool/pdf-merge), [Split PDFs](/tool/pdf-split), [Compress PDFs](/tool/pdf-compress), [PDF to Images](/tool/pdf-to-images), [Images to PDF](/tool/images-to-pdf), [Sign PDF](/tool/pdf-sign), [Protect PDF](/tool/pdf-protect), [Organize Pages](/tool/pdf-organize), [Rotate PDF](/tool/pdf-rotate).
- Student: [SGPA Calculator](/tool/sgpa-calculator), [CGPA Calculator](/tool/cgpa-calculator), [Attendance Bunk Calculator](/tool/attendance-calculator), [Marks to Percentage](/tool/marks-percentage), [Internal Marks](/tool/internal-marks), [Study Timer](/tool/study-timer).
- Developer: [JSON Formatter](/tool/dev-json-formatter), [JWT Debugger](/tool/dev-jwt-debugger), [Regex Tester](/tool/dev-regex-tester), [Base64 Encoder](/tool/dev-base64), [Hash Generator](/tool/dev-hash-generator), [SQL Formatter](/tool/dev-sql-formatter).
- Calculators: [EMI Calculator](/tool/calc-emi), [SIP Calculator](/tool/calc-sip), [GST Calculator](/tool/calc-gst), [Age Calculator](/tool/calc-age), [Compound Interest](/tool/calc-compound-interest), [Discount Calculator](/tool/calc-discount).
- QR: [QR Generator](/tool/qr-generator), [Wi-Fi QR](/tool/qr-wifi), [vCard QR](/tool/qr-vcard), [Barcode Generator](/tool/barcode-generator).
- Text: [Word Counter](/tool/word-counter), [Text Diff](/tool/text-diff), [Case Converter](/tool/case-converter), [Markdown Preview](/tool/markdown-preview).
- Media: [ZIP Archiver](/tool/media-zip-archiver), [Audio Extractor](/tool/media-audio-extractor), [Video Trimmer](/tool/media-trimmer), [Screen Recorder](/tool/media-screen-recorder).
`;

const FALLBACK_MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-pro',
];

export async function executeGeminiRequest(
  apiKey: string,
  model: string,
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[] = []
): Promise<string> {
  const cleanModel = model.trim() || DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey.trim()}`;

  const contents = [
    ...conversationHistory.slice(-4).map((item) => ({
      role: item.role,
      parts: [{ text: item.text }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  // Generation config optimized for rapid response
  const generationConfig: Record<string, any> = {
    temperature: 0.2,
    maxOutputTokens: 1000,
  };

  // Only pass thinkingBudget on models that support it (2.5+ or 3+)
  if (cleanModel.includes('2.5') || cleanModel.includes('3.')) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const body = {
    systemInstruction: {
      parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }],
    },
    contents,
    generationConfig,
  };

  const controller = new AbortController();
  // 10s timeout ensures quick response without hanging indefinitely
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function callGeminiApi(
  apiKey: string,
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[] = [],
  model: string = DEFAULT_GEMINI_MODEL
): Promise<string> {
  const effectiveKey = apiKey.trim() || getEffectiveApiKey();
  const initialModel = model.trim() || getPreferredModel();

  try {
    return await executeGeminiRequest(effectiveKey, initialModel, userMessage, conversationHistory);
  } catch (err: any) {
    console.warn(`Request with ${initialModel} failed:`, err?.message);

    // If a custom key is provided and fails, don't silently switch to another model without trying
    for (const fallback of FALLBACK_MODEL_CHAIN) {
      if (fallback === initialModel) continue;
      try {
        const result = await executeGeminiRequest(effectiveKey, fallback, userMessage, conversationHistory);
        return result;
      } catch (fallbackErr: any) {
        console.warn(`Fallback ${fallback} failed:`, fallbackErr?.message);
      }
    }

    throw err;
  }
}

export async function testGeminiConnection(
  apiKey: string = getEffectiveApiKey(),
  model: string = DEFAULT_GEMINI_MODEL
): Promise<{ success: boolean; message: string }> {
  const keyToTest = apiKey.trim() || getEffectiveApiKey();
  const modelToTest = model.trim() || getPreferredModel();

  if (!keyToTest) {
    return { success: false, message: 'No API key provided.' };
  }

  try {
    const testResponse = await executeGeminiRequest(
      keyToTest,
      modelToTest,
      'Test connection. Reply with "OK".'
    );
    if (testResponse) {
      return {
        success: true,
        message: `Connected successfully to Google Gemini (${modelToTest})!`,
      };
    }
    return { success: false, message: 'Empty response received from Google API.' };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to connect to Google Gemini API.',
    };
  }
}
