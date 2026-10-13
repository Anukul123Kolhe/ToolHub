import { TOOLS } from '../../config/tools';
import { ToolRegistryItem } from '../../types/tool';

export interface AIActionPlan {
  tool: ToolRegistryItem;
  parameters: Record<string, any>;
  filesRequiredCount: number;
  description: string;
  isDestructive?: boolean;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  actionPlan?: AIActionPlan;
  executionResult?: {
    success: boolean;
    summary: string;
    downloadUrl?: string;
    downloadFilename?: string;
  };
}

/**
 * Client-Side Heuristic Intent Resolver
 * Accurately parses natural language requests to registered tools with parameters
 * Works 100% offline with zero external API dependencies
 */
export function resolveNaturalLanguageIntent(
  userText: string,
  stagedFiles: File[] = []
): { message: string; actionPlan?: AIActionPlan } {
  const query = userText.toLowerCase();

  // 1. Exact size image compression (e.g. "compress to 50kb", "under 100kb")
  const kbMatch = query.match(/(?:compress|reduce|shrink|make).*?(?:to|under|less than)?\s*(\d+)\s*(?:kb|k)/i);
  if (kbMatch || query.includes('exact size') || (query.includes('compress') && (query.includes('photo') || query.includes('image')) && /\d+/.test(query))) {
    const targetKb = kbMatch ? parseInt(kbMatch[1], 10) : 50;
    const tool = TOOLS.find((t) => t.id === 'image-exact-size')!;
    return {
      message: `I've prepared the Exact-Target-Size Compressor with a target limit of ${targetKb} KB. Click Confirm to compress your image locally.`,
      actionPlan: {
        tool,
        parameters: { targetKb },
        filesRequiredCount: 1,
        description: `Compress image to under ${targetKb} KB using iterative binary search`,
      },
    };
  }

  // 2. Standard image compression
  if (query.includes('compress') && (query.includes('image') || query.includes('photo') || query.includes('picture') || query.includes('jpg') || query.includes('png'))) {
    const tool = TOOLS.find((t) => t.id === 'image-compressor')!;
    return {
      message: "I will compress your photo with our balanced 75% quality preset. You can download the optimized result immediately.",
      actionPlan: {
        tool,
        parameters: { quality: 75, format: 'image/jpeg' },
        filesRequiredCount: 1,
        description: 'Compress image with 75% quality slider',
      },
    };
  }

  // 3. Image resizing (e.g. "resize signature to 300x100", "resize photo to 600px")
  const dimMatch = query.match(/(\d+)\s*(?:x|by|\*)\s*(\d+)/i);
  if (query.includes('resize') || query.includes('dimensions') || dimMatch) {
    const width = dimMatch ? parseInt(dimMatch[1], 10) : 300;
    const height = dimMatch ? parseInt(dimMatch[2], 10) : 100;
    const tool = query.includes('signature')
      ? TOOLS.find((t) => t.id === 'signature-resizer')!
      : TOOLS.find((t) => t.id === 'image-resizer')!;

    return {
      message: `I will resize your image to exact dimensions: ${width} × ${height} pixels.`,
      actionPlan: {
        tool,
        parameters: { width, height },
        filesRequiredCount: 1,
        description: `Resize to ${width}px width × ${height}px height`,
      },
    };
  }

  // 4. PDF Merge
  if (query.includes('merge') && query.includes('pdf')) {
    const tool = TOOLS.find((t) => t.id === 'pdf-merge')!;
    return {
      message: `I can merge your PDF documents into a single file. Please ensure you have staged at least 2 PDF files below.`,
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 2,
        description: 'Merge staged PDF documents in sequential order',
      },
    };
  }

  // 5. Images to PDF
  if ((query.includes('convert') || query.includes('turn')) && query.includes('images') && query.includes('pdf')) {
    const tool = TOOLS.find((t) => t.id === 'images-to-pdf')!;
    return {
      message: 'I can convert your photos into a unified, printable PDF document.',
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 1,
        description: 'Convert staged photos to PDF document',
      },
    };
  }

  // 6. SGPA / CGPA Calculation
  if (query.includes('sgpa') || query.includes('gpa') || query.includes('cgpa') || query.includes('grade point')) {
    const tool = TOOLS.find((t) => t.id === 'sgpa-calculator')!;
    return {
      message: 'Opening the SGPA Calculator. You can enter course credits and grade points to compute your exact GPA.',
      actionPlan: {
        tool,
        parameters: { scale: '10' },
        filesRequiredCount: 0,
        description: 'Launch SGPA Calculator with 10-point scale',
      },
    };
  }

  // 7. Attendance Calculator
  if (query.includes('attendance') || query.includes('bunk') || query.includes('75 percent')) {
    const tool = TOOLS.find((t) => t.id === 'attendance-calculator')!;
    return {
      message: 'Opening the Attendance Calculator to determine your current percentage and safe bunk count.',
      actionPlan: {
        tool,
        parameters: { target: 75 },
        filesRequiredCount: 0,
        description: 'Launch Attendance Calculator with 75% target',
      },
    };
  }

  // 8. JSON formatting
  if (query.includes('json') && (query.includes('format') || query.includes('beautify') || query.includes('validate') || query.includes('pretty'))) {
    const tool = TOOLS.find((t) => t.id === 'dev-json-formatter')!;
    return {
      message: 'Opening the JSON Formatter & Validator with 2-space indentation.',
      actionPlan: {
        tool,
        parameters: { indent: 2 },
        filesRequiredCount: 0,
        description: 'Format and validate JSON payload',
      },
    };
  }

  // 9. QR code generation
  if (query.includes('qr') || query.includes('qrcode')) {
    const tool = query.includes('wifi')
      ? TOOLS.find((t) => t.id === 'qr-wifi')!
      : TOOLS.find((t) => t.id === 'qr-generator')!;
    return {
      message: 'Opening the QR Code Generator. You can customize colors and export in PNG or SVG.',
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 0,
        description: 'Generate customizable QR Code',
      },
    };
  }

  // 10. Passwords
  if (query.includes('password') && (query.includes('generate') || query.includes('make') || query.includes('random') || query.includes('strong'))) {
    const tool = TOOLS.find((t) => t.id === 'password-generator')!;
    return {
      message: 'Opening the CSPRNG Password Generator to create high-entropy cryptographically secure credentials.',
      actionPlan: {
        tool,
        parameters: { length: 18 },
        filesRequiredCount: 0,
        description: 'Generate 18-character CSPRNG secure password',
      },
    };
  }

  // 11. Word count & Text cleaner
  if (query.includes('count') && query.includes('word')) {
    const tool = TOOLS.find((t) => t.id === 'word-counter')!;
    return {
      message: 'Opening the Word & Character Counter with reading time analysis.',
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 0,
        description: 'Analyze word count, characters, and reading time',
      },
    };
  }

  // Fallback: Semantic matching against tool registry keywords
  const matchedTool = TOOLS.find(
    (t) =>
      t.keywords.some((k) => query.includes(k)) ||
      t.synonyms.some((s) => query.includes(s))
  );

  if (matchedTool) {
    return {
      message: `I identified that **${matchedTool.name}** is the best match for your request. Click below to proceed with this tool.`,
      actionPlan: {
        tool: matchedTool,
        parameters: {},
        filesRequiredCount: matchedTool.supportedFormats && matchedTool.supportedFormats.length > 0 ? 1 : 0,
        description: `Execute ${matchedTool.name}`,
      },
    };
  }

  return {
    message: `I understand you're looking for help. I can orchestrate image compression, PDF merging, SGPA calculations, QR codes, code formatting, and 140+ utilities. Could you clarify what task you'd like to perform?`,
  };
}
