import { TOOLS } from '../../config/tools';

const GEMINI_SYSTEM_INSTRUCTION = `
You are ToolHub Assistant, an expert AI utility consultant for ToolHub (a privacy-first, 100% in-browser online utility platform).
You help users find, understand, and use online tools for PDF editing, image processing, student GPA/attendance calculations, developer formatting, everyday calculations, and file utilities.

Core Platform Principles:
1. All file tools process files 100% locally in the browser memory (Zero server uploads).
2. Recommend the exact ToolHub tool with its path when relevant.

Key Available Tools on ToolHub:
${TOOLS.slice(0, 50).map((t) => `- ${t.name} (ID: ${t.id}, Path: ${t.path}): ${t.shortDescription || t.description}`).join('\n')}
...and over 100 other utilities.

Guidelines:
- Be concise, helpful, and friendly.
- When recommending a tool, provide the tool name and markdown link, for example: [Image Exact Size Compressor](/tool/image-exact-size).
- For mathematical or GPA calculations, explain the formulas clearly.
`;

export async function callGeminiApi(
  apiKey: string,
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[] = []
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

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
      maxOutputTokens: 1000,
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
    throw new Error(`Gemini API Error: ${errorMsg}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return text;
}
