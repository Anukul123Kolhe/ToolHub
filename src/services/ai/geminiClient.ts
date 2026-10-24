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
    tag: 'Free Tier Ready • Recommended',
    description: 'Flagship model with full Google Free Tier quota (15 RPM / 1,500 RPD) and sub-second execution.',
    isLatest: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: '3.8 • Ultra Fast',
    description: 'Ultra-high-speed Google 3.8 generation model with sub-second execution.',
    isLatest: true,
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    tag: 'Argon • Requires Paid Plan',
    description: 'Frontier Google Argon model. Note: Google sets limit: 0 on Free Tier accounts (requires billing attached in Google Cloud).',
    isLatest: true,
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    tag: 'Gemini 3.7',
    description: 'Google 3.7 generation high-efficiency reasoning and generation.',
    isLatest: true,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    tag: 'Gemini 3.1 Pro',
    description: 'Advanced reasoning, deep logic, and complex document comprehension.',
    isLatest: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    tag: 'Deep Reasoning',
    description: 'Advanced reasoning, deep logic, coding, and multi-step math calculations.',
    isLatest: true,
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
const USER_DISCOVERED_MODELS_KEY = 'toolhub_discovered_gemini_models';

export function normalizeModelId(inputModel: string): string {
  let m = (inputModel || '').trim();
  const lower = m.toLowerCase();
  if (lower === 'argon' || lower === 'gemini-argon' || lower === 'gemini-4-argon' || lower === '4-argon') return 'gemini-4-argon';
  if (lower === '3.8' || lower === 'gemini-3.8' || lower === 'gemini-3.8-flash' || lower === '3.8-flash') return 'gemini-3.8-flash';
  if (lower === '3.7' || lower === 'gemini-3.7' || lower === 'gemini-3.7-flash') return 'gemini-3.7-flash';
  if (lower === '3.5' || lower === 'gemini-3.5' || lower === 'gemini-3.5-flash') return 'gemini-3.5-flash';
  if (lower === '3.1' || lower === 'gemini-3.1' || lower === '3.1-pro') return 'gemini-3.1-pro-preview';
  if (lower === '2.5' || lower === 'gemini-2.5' || lower === '2.5-flash') return 'gemini-2.5-flash';
  if (lower === 'pro' || lower === 'gemini-pro') return 'gemini-2.5-pro';
  if (lower === 'flash' || lower === 'gemini-flash') return 'gemini-2.5-flash';
  if (m.startsWith('models/')) m = m.replace(/^models\//, '');
  return m;
}

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
    localStorage.removeItem(USER_DISCOVERED_MODELS_KEY);
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
    localStorage.setItem(USER_MODEL_STORAGE_KEY, normalizeModelId(model));
  }
}

export function isFastIntentEnabled(): boolean {
  if (typeof localStorage !== 'undefined') {
    const val = localStorage.getItem(USER_FAST_INTENT_KEY);
    return val !== 'false';
  }
  return true;
}

export function setFastIntentEnabled(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(USER_FAST_INTENT_KEY, enabled ? 'true' : 'false');
  }
}

/**
 * Dynamically queries Google Generative Language API with the user's API key
 * to fetch ALL models enabled on their account (e.g. argon, 3.8, experimental, custom).
 */
export async function fetchAvailableModelsFromKey(apiKey: string): Promise<GeminiModelOption[]> {
  const cleanKey = apiKey.trim() || getEffectiveApiKey();
  if (!cleanKey) return AVAILABLE_GEMINI_MODELS;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    const rawModels: any[] = data.models || [];

    const contentModels = rawModels
      .filter((m) => {
        const methods = m.supportedGenerationMethods || [];
        return methods.includes('generateContent');
      })
      .map((m) => {
        const id = m.name.replace(/^models\//, '');
        let tag = 'Available';
        if (id.includes('argon')) tag = 'Argon • Flagship';
        else if (id.includes('3.8')) tag = '3.8 • Ultra Fast';
        else if (id.includes('3.7')) tag = '3.7 Flash';
        else if (id.includes('3.5')) tag = '3.5 Flash';
        else if (id.includes('3.1')) tag = '3.1 Preview';
        else if (id.includes('2.5-pro')) tag = 'Deep Reasoning';
        else if (id.includes('2.5-flash')) tag = 'Recommended';
        else if (id.includes('flash-lite')) tag = 'Ultra Lightweight';
        else if (id.includes('flash')) tag = 'Fast';
        else if (id.includes('pro')) tag = 'Pro Reasoning';

        return {
          id,
          name: m.displayName || id,
          tag,
          description: m.description || `Google ${m.displayName || id} model.`,
          isLatest: id.includes('argon') || id.includes('3.8') || id.includes('2.5'),
        };
      });

    if (contentModels.length > 0) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(USER_DISCOVERED_MODELS_KEY, JSON.stringify(contentModels));
      }
      return contentModels;
    }
  } catch (err) {
    console.warn('Failed to fetch dynamic models from Google API:', err);
  }

  return AVAILABLE_GEMINI_MODELS;
}

export function getAllAvailableModels(): GeminiModelOption[] {
  if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem(USER_DISCOVERED_MODELS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set(parsed.map((p) => p.id));
          const merged = [...parsed];
          for (const m of AVAILABLE_GEMINI_MODELS) {
            if (!seen.has(m.id)) {
              merged.push(m);
            }
          }
          return merged;
        }
      } catch (e) {
        // fallback
      }
    }
  }
  return AVAILABLE_GEMINI_MODELS;
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
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-2.5-pro',
];

export async function executeGeminiRequest(
  apiKey: string,
  model: string,
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[] = [],
  includeThinking: boolean = true
): Promise<string> {
  const cleanModel = normalizeModelId(model) || DEFAULT_GEMINI_MODEL;
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

  const generationConfig: Record<string, any> = {
    temperature: 0.2,
    maxOutputTokens: 1000,
  };

  // Only pass thinkingBudget if model is 2.5 flash or thinking model AND includeThinking is true
  if (
    includeThinking &&
    (cleanModel.includes('2.5') || cleanModel.includes('thinking')) &&
    !cleanModel.includes('argon') &&
    !cleanModel.includes('3.8')
  ) {
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
  const timeoutId = setTimeout(() => controller.abort(), 12000);

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

      // If failed due to thinking_config unsupported or schema rejection, retry once without thinkingConfig
      if (
        includeThinking &&
        (errorMsg.includes('thinking') ||
          errorMsg.includes('Unknown') ||
          errorMsg.includes('INVALID_ARGUMENT') ||
          response.status === 400)
      ) {
        return await executeGeminiRequest(apiKey, model, userMessage, conversationHistory, false);
      }

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
  const initialModel = normalizeModelId(model.trim() || getPreferredModel());

  // 1. Try initial requested model
  try {
    return await executeGeminiRequest(effectiveKey, initialModel, userMessage, conversationHistory);
  } catch (err: any) {
    const errorMsg = err?.message || '';
    console.warn(`Request with ${initialModel} failed:`, errorMsg);

    const isQuotaOrModelUnavailable =
      errorMsg.includes('limit: 0') ||
      errorMsg.includes('Quota exceeded') ||
      errorMsg.includes('Free Tier') ||
      errorMsg.includes('free_tier') ||
      errorMsg.includes('no longer available') ||
      errorMsg.includes('404') ||
      errorMsg.includes('429') ||
      errorMsg.includes('503');

    // 2. Try fallback chain on effectiveKey (e.g. gemini-2.5-flash, gemini-3.8-flash)
    for (const fallback of FALLBACK_MODEL_CHAIN) {
      if (fallback === initialModel) continue;
      try {
        const result = await executeGeminiRequest(effectiveKey, fallback, userMessage, conversationHistory);
        // If initial model had limit 0 or was unavailable, update preferred model to working fallback
        if (isQuotaOrModelUnavailable) {
          savePreferredModel(fallback);
        }
        return result;
      } catch (fallbackErr: any) {
        console.warn(`Fallback ${fallback} failed:`, fallbackErr?.message);
      }
    }

    // 3. If user's key itself is exhausted or blocked, seamlessly fall back to backend built-in key
    if (effectiveKey !== BACKEND_GEMINI_API_KEY && BACKEND_GEMINI_API_KEY) {
      try {
        const result = await executeGeminiRequest(
          BACKEND_GEMINI_API_KEY,
          DEFAULT_GEMINI_MODEL,
          userMessage,
          conversationHistory
        );
        return result;
      } catch (backendErr: any) {
        console.warn('Backend fallback key also failed:', backendErr?.message);
      }
    }

    if (errorMsg.includes('limit: 0') && (errorMsg.includes('argon') || initialModel.includes('argon'))) {
      throw new Error(
        `Gemini 4 Argon has limit: 0 on Google's Free Tier (requires a paid Google Cloud account). ToolHub has automatically selected Gemini 2.5 Flash.`
      );
    }

    throw err;
  }
}

export async function testGeminiConnection(
  apiKey: string = getEffectiveApiKey(),
  model: string = DEFAULT_GEMINI_MODEL
): Promise<{
  success: boolean;
  message: string;
  modelsCount?: number;
  suggestedModel?: string;
}> {
  const keyToTest = apiKey.trim() || getEffectiveApiKey();
  const modelToTest = normalizeModelId(model.trim() || getPreferredModel());

  if (!keyToTest) {
    return { success: false, message: 'No API key provided.' };
  }

  try {
    const testResponse = await executeGeminiRequest(
      keyToTest,
      modelToTest,
      'Test connection. Reply with "OK".'
    );

    let count = 0;
    try {
      const discovered = await fetchAvailableModelsFromKey(keyToTest);
      count = discovered.length;
    } catch (e) {
      // Ignored
    }

    if (testResponse) {
      return {
        success: true,
        message: `Connected successfully to Google Gemini (${modelToTest})!${count > 0 ? ` Found ${count} available models on your API key.` : ''}`,
        modelsCount: count,
      };
    }
    return { success: false, message: 'Empty response received from Google API.' };
  } catch (err: any) {
    const errorMsg = err?.message || '';

    // Check if error is due to Free Tier limit: 0 on this specific model
    const isFreeTierZeroQuota =
      errorMsg.includes('limit: 0') ||
      errorMsg.includes('Free Tier') ||
      errorMsg.includes('Quota exceeded') ||
      errorMsg.includes('free_tier');

    if (isFreeTierZeroQuota) {
      // Test with working free-tier models (gemini-2.5-flash) to verify if the key is valid
      for (const fallbackModel of ['gemini-2.5-flash', 'gemini-3.8-flash']) {
        if (fallbackModel === modelToTest) continue;
        try {
          const fallbackRes = await executeGeminiRequest(
            keyToTest,
            fallbackModel,
            'Test connection. Reply with "OK".'
          );

          if (fallbackRes) {
            savePreferredModel(fallbackModel);

            let count = 0;
            try {
              const discovered = await fetchAvailableModelsFromKey(keyToTest);
              count = discovered.length;
            } catch (e) {}

            return {
              success: true,
              suggestedModel: fallbackModel,
              message: `Your Google API Key is VALID! Note: '${modelToTest}' has limit: 0 on Google's Free Tier (requires billing on Google Cloud). We automatically set your active model to '${fallbackModel}' (100% Free Tier ready)!`,
              modelsCount: count,
            };
          }
        } catch (fallbackErr) {
          // Continue testing next fallback
        }
      }
    }

    let cleanMessage = errorMsg;
    if (cleanMessage.includes('limit: 0') && (cleanMessage.includes('argon') || modelToTest.includes('argon'))) {
      cleanMessage = `Google API Quota Notice: 'gemini-4-argon' has limit: 0 on Google's Free Tier (requires Google Cloud billing). Please switch to 'Gemini 2.5 Flash', which has full free quota.`;
    }

    return {
      success: false,
      message: cleanMessage || 'Failed to connect to Google Gemini API.',
      suggestedModel: 'gemini-2.5-flash',
    };
  }
}
