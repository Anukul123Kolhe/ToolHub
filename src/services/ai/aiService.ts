import { TOOLS } from '../../config/tools';
import { CATEGORIES } from '../../config/categories';
import { ToolCategory, ToolRegistryItem } from '../../types/tool';

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

interface CategoryDefinition {
  id: ToolCategory;
  name: string;
  keywords: string[];
}

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: 'image',
    name: 'Image & Photo Utilities',
    keywords: [
      'image', 'images', 'photo', 'photos', 'picture', 'pictures',
      'graphic', 'graphics', 'heic', 'svg', 'wallpaper', 'crop',
      'watermark', 'palette', 'exif', 'blur', 'jpg', 'jpeg', 'png', 'webp'
    ],
  },
  {
    id: 'pdf',
    name: 'PDF & Document Utilities',
    keywords: ['pdf', 'pdfs', 'document', 'documents', 'acrobat'],
  },
  {
    id: 'student',
    name: 'Student & Academic Calculators',
    keywords: [
      'student', 'students', 'academic', 'college', 'university',
      'school', 'study', 'exam', 'sgpa', 'cgpa', 'attendance',
      'bunk', 'marks', 'syllabus', 'grade', 'grades'
    ],
  },
  {
    id: 'developer',
    name: 'Developer & Web Utilities',
    keywords: [
      'dev', 'developer', 'developers', 'code', 'coding', 'programming',
      'web dev', 'json', 'jwt', 'regex', 'hash', 'base64', 'sql',
      'formatter', 'minifier', 'timestamp'
    ],
  },
  {
    id: 'calculator',
    name: 'Financial & Math Calculators',
    keywords: [
      'calc', 'calculator', 'calculators', 'finance', 'financial',
      'math', 'emi', 'loan', 'sip', 'gst', 'interest', 'discount', 'percentage'
    ],
  },
  {
    id: 'text',
    name: 'Text & Writing Utilities',
    keywords: [
      'text', 'string', 'writing', 'word', 'words', 'diff',
      'markdown', 'slug', 'lorem', 'counter', 'case'
    ],
  },
  {
    id: 'qr',
    name: 'QR Code & Barcode Utilities',
    keywords: ['qr', 'barcode', 'barcodes', 'qrcode', 'qrcodes'],
  },
  {
    id: 'productivity',
    name: 'Productivity & Planning Tools',
    keywords: [
      'productivity', 'pomodoro', 'timer', 'stopwatch', 'todo',
      'planner', 'planning', 'habit', 'habits', 'notes'
    ],
  },
  {
    id: 'career',
    name: 'Career & Professional Tools',
    keywords: ['career', 'resume', 'cv', 'job', 'jobs', 'interview', 'portfolio', 'cover letter'],
  },
  {
    id: 'media',
    name: 'Media & File Tools',
    keywords: [
      'media', 'audio', 'video', 'sound', 'mp3', 'mp4',
      'recording', 'screen record', 'recorder', 'zip', 'archive'
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced & System Utilities',
    keywords: ['advanced', 'system', 'network', 'security', 'privacy', 'ping', 'ip', 'uuid'],
  },
];

function formatToolBullet(tool: ToolRegistryItem): string {
  const desc = tool.shortDescription || tool.description;
  return `* [${tool.name}](${tool.path}) – ${desc}`;
}

function formatCategoryToolList(categoryName: string, tools: ToolRegistryItem[]): string {
  return [
    `Here is the complete collection of **${categoryName}** on ToolHub (all run **100% privately in your browser** with zero file uploads):`,
    '',
    ...tools.map(formatToolBullet),
    '',
    `💡 *Tip: Click on any tool link above or select from the connected tool cards below to open it immediately!*`,
  ].join('\n');
}

function formatAllCategoriesOverview(): string {
  return [
    `ToolHub features **400+ privacy-first utilities** across 11 major categories. All file operations run **100% locally in your browser** with zero server uploads:`,
    '',
    `### 📄 PDF & Documents (17 Tools)`,
    `* [Merge PDFs](/tool/pdf-merge) • [Split PDFs](/tool/pdf-split) • [Compress PDFs](/tool/pdf-compress) • [PDF to Images](/tool/pdf-to-images) • [Images to PDF](/tool/images-to-pdf) • [Sign PDF](/tool/pdf-sign) • [Protect PDF](/tool/pdf-protect)`,
    '',
    `### 🖼️ Image & Photos (18 Tools)`,
    `* [Image Compressor](/tool/image-compressor) • [Exact-Size Compressor](/tool/image-exact-size) • [Image Resizer](/tool/image-resizer) • [Signature Resizer](/tool/signature-resizer) • [Image Cropper](/tool/image-cropper) • [Format Converter](/tool/image-converter) • [HEIC to JPG](/tool/heic-to-jpg) • [OCR Extractor](/tool/ocr-extractor)`,
    '',
    `### 🎓 Students & Academics (10 Tools)`,
    `* [SGPA Calculator](/tool/sgpa-calculator) • [CGPA Calculator](/tool/cgpa-calculator) • [Attendance Bunk Calculator](/tool/attendance-calculator) • [Marks to Percentage](/tool/marks-percentage) • [Internal Marks Planner](/tool/internal-marks)`,
    '',
    `### 💻 Developers & Web (12 Tools)`,
    `* [JSON Formatter & Validator](/tool/dev-json-formatter) • [JWT Debugger](/tool/dev-jwt-debugger) • [Regex Tester](/tool/dev-regex-tester) • [Base64 Encoder/Decoder](/tool/dev-base64) • [Hash Generator](/tool/dev-hash-generator) • [SQL Formatter](/tool/dev-sql-formatter)`,
    '',
    `### 💰 Finance & Math (10 Tools)`,
    `* [EMI Calculator](/tool/calc-emi) • [SIP Calculator](/tool/calc-sip) • [GST Calculator](/tool/calc-gst) • [Compound Interest](/tool/calc-compound-interest) • [Discount Calculator](/tool/calc-discount)`,
    '',
    `### 📱 QR & Barcodes (5 Tools)`,
    `* [QR Code Generator](/tool/qr-generator) • [Wi-Fi QR Code](/tool/qr-wifi) • [vCard Contact QR](/tool/qr-vcard) • [Barcode Generator](/tool/barcode-generator)`,
    '',
    `### ✍️ Text & Writing (8 Tools)`,
    `* [Word Counter](/tool/word-counter) • [Text Diff Checker](/tool/text-diff) • [Case Converter](/tool/case-converter) • [Markdown Previewer](/tool/markdown-preview)`,
    '',
    `### ⏱️ Productivity & Daily (10 Tools)`,
    `* [Pomodoro Timer](/tool/prod-pomodoro) • [Kanban Board](/tool/prod-kanban) • [Habit Tracker](/tool/prod-habits) • [Quick Notes](/tool/prod-notes)`,
    '',
    `### 💼 Career & Jobs (8 Tools)`,
    `* [ATS Resume Builder](/tool/career-resume) • [Cover Letter Generator](/tool/career-cover-letter) • [Job Application Tracker](/tool/career-job-tracker)`,
    '',
    `### 🎥 Media & Archives (12 Tools)`,
    `* [In-Browser ZIP Archiver](/tool/media-zip-archiver) • [Audio Extractor](/tool/media-audio-extractor) • [Video Trimmer](/tool/media-trimmer) • [Screen Recorder](/tool/media-screen-recorder)`,
    '',
    `### ⚡ Advanced & System (14 Tools)`,
    `* [In-Browser OCR](/tool/adv-ocr) • [EXIF Stripper](/tool/adv-exif-stripper) • [CSPRNG Password Generator](/tool/adv-password-generator) • [UUID Generator](/tool/adv-uuid-generator)`,
    '',
    `💬 *Ask me about any category (e.g. "Give me list of image tools") or tell me your specific task (e.g. "Compress photo under 50KB") to get started!*`,
  ].join('\n');
}

/**
 * Client-Side Heuristic Intent Resolver
 * Accurately parses natural language requests to registered tools with parameters
 * Works 100% offline with zero external API dependencies
 */
export function resolveNaturalLanguageIntent(
  userText: string,
  _stagedFiles: File[] = []
): { message: string; actionPlan?: AIActionPlan } {
  const query = userText.toLowerCase().trim();

  // 1. ALL TOOLS / GLOBAL OVERVIEW REQUESTS
  const isAllToolsRequest =
    /\b(all tools|list of all|list tools|all utilities|what can you do|what tools|show tools|browse tools|overview|menu|features|categories)\b/i.test(query) ||
    query === 'tools' || query === 'utilities' || query === 'help' || query === 'list';

  if (isAllToolsRequest) {
    return {
      message: formatAllCategoriesOverview(),
    };
  }

  // 2. CATEGORY LISTING / DISCOVERY REQUESTS
  // Checks if the user asks for tools in a category (e.g., "Give me list of image tools", "image tools", "show pdf tools")
  const isListIntent =
    /\b(list|show|give|tell|browse|which|what|available|options|catalog|directory|collection|all|every|explore)\b/i.test(query) ||
    /\btools\b/i.test(query) ||
    /\butilities\b/i.test(query) ||
    /\bcalculators\b/i.test(query);

  if (isListIntent) {
    for (const cat of CATEGORY_DEFINITIONS) {
      const matchesCategory = cat.keywords.some((k) => {
        const regex = new RegExp(`\\b${k}\\b`, 'i');
        return regex.test(query);
      });

      if (matchesCategory) {
        // Exclude specific single-task queries (e.g. "compress to 50kb" or "resize signature to 300x100")
        const hasSpecificAction =
          /\b(compress to|less than|under|\d+\s*kb|\d+\s*x\s*\d+|merge these|convert these)\b/i.test(query);

        if (!hasSpecificAction) {
          const matchingTools = TOOLS.filter((t) => t.category === cat.id);
          if (matchingTools.length > 0) {
            return {
              message: formatCategoryToolList(cat.name, matchingTools),
            };
          }
        }
      }
    }
  }

  // 3. CROSS-CATEGORY ACTION GROUPS
  // Compression tools
  if (/\b(compression|compress tools|tools for compression|shrink tools)\b/i.test(query)) {
    const tools = TOOLS.filter((t) =>
      ['image-compressor', 'image-exact-size', 'pdf-compress', 'media-video-compressor', 'media-audio-compressor'].includes(t.id)
    );
    return {
      message: [
        `Here are the **Compression Tools** available on ToolHub (100% in-browser processing):`,
        '',
        ...tools.map(formatToolBullet),
        '',
        `💡 *Click any tool above or choose from the cards below to start optimizing your files!*`,
      ].join('\n'),
    };
  }

  // Converter tools
  if (/\b(convert tools|converters|conversion tools|tools to convert)\b/i.test(query)) {
    const tools = TOOLS.filter((t) =>
      ['image-converter', 'svg-to-png', 'heic-to-jpg', 'pdf-to-images', 'images-to-pdf', 'case-converter', 'media-video-converter', 'media-audio-converter'].includes(t.id)
    );
    return {
      message: [
        `Here are the **File & Format Converters** on ToolHub (zero server uploads):`,
        '',
        ...tools.map(formatToolBullet),
        '',
        `💡 *Select any converter above to transform your formats instantly!*`,
      ].join('\n'),
    };
  }

  // Resize tools
  if (/\b(resize tools|resizers|tools to resize)\b/i.test(query)) {
    const tools = TOOLS.filter((t) =>
      ['image-resizer', 'bulk-image-resizer', 'signature-resizer'].includes(t.id)
    );
    return {
      message: [
        `Here are the **Image & Signature Resizing Tools** on ToolHub:`,
        '',
        ...tools.map(formatToolBullet),
        '',
        `💡 *Click any tool above to adjust dimensions by pixels or percentage!*`,
      ].join('\n'),
    };
  }

  // 4. SPECIFIC TARGETED TASKS WITH ACTION PLANS

  // Exact target size image compression (e.g. "compress to 50kb", "under 100kb")
  const kbMatch = query.match(/(?:compress|reduce|shrink|make).*?(?:to|under|less than)?\s*(\d+)\s*(?:kb|k)/i);
  if (kbMatch || query.includes('exact size') || (query.includes('compress') && (query.includes('photo') || query.includes('image')) && /\d+/.test(query))) {
    const targetKb = kbMatch ? parseInt(kbMatch[1], 10) : 50;
    const tool = TOOLS.find((t) => t.id === 'image-exact-size')!;
    return {
      message: [
        `I've prepared the **[${tool.name}](${tool.path})** for you with a target limit of **${targetKb} KB**.`,
        '',
        `### ✨ Key Features:`,
        `* **Binary Search Algorithm**: Iteratively optimizes compression to keep image strictly under ${targetKb} KB.`,
        `* **100% In-Browser Privacy**: Your photos remain in memory and are never sent to external servers.`,
        `* **Instant Preview & Download**: Inspect file sizes before and after compression.`,
        '',
        `Click the tool link above or the connected card below to proceed!`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: { targetKb },
        filesRequiredCount: 1,
        description: `Compress image to under ${targetKb} KB using iterative binary search`,
      },
    };
  }

  // Standard image compression
  if (query.includes('compress') && (query.includes('image') || query.includes('photo') || query.includes('picture') || query.includes('jpg') || query.includes('png'))) {
    const tool = TOOLS.find((t) => t.id === 'image-compressor')!;
    return {
      message: [
        `I recommend the **[${tool.name}](${tool.path})** utility.`,
        '',
        `### ✨ Capabilities:`,
        `* **Custom Quality Slider**: Fine-tune JPEG, PNG, and WebP compression ratio from 1% to 100%.`,
        `* **Lossless & Balanced Modes**: Balance file size reduction with visual sharpness.`,
        `* **Batch Processing**: Compress multiple images with instant zip or individual download.`,
        '',
        `Click the tool above or open the card below to start compressing!`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: { quality: 75, format: 'image/jpeg' },
        filesRequiredCount: 1,
        description: 'Compress image with 75% quality slider',
      },
    };
  }

  // Image resizing (e.g. "resize signature to 300x100", "resize photo to 600px")
  const dimMatch = query.match(/(\d+)\s*(?:x|by|\*)\s*(\d+)/i);
  if (query.includes('resize') || query.includes('dimensions') || dimMatch) {
    const width = dimMatch ? parseInt(dimMatch[1], 10) : 300;
    const height = dimMatch ? parseInt(dimMatch[2], 10) : 100;
    const tool = query.includes('signature')
      ? TOOLS.find((t) => t.id === 'signature-resizer')!
      : TOOLS.find((t) => t.id === 'image-resizer')!;

    return {
      message: [
        `I've configured the **[${tool.name}](${tool.path})** for target dimensions of **${width} × ${height} px**.`,
        '',
        `* **Aspect Ratio Locking**: Prevent distortion while scaling.`,
        `* **Portal Pre-sets**: Optimized for government exam portals, passports, and online forms.`,
        '',
        `Click below to open the tool with your desired specifications!`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: { width, height },
        filesRequiredCount: 1,
        description: `Resize to ${width}px width × ${height}px height`,
      },
    };
  }

  // PDF Merge
  if (query.includes('merge') && query.includes('pdf')) {
    const tool = TOOLS.find((t) => t.id === 'pdf-merge')!;
    return {
      message: [
        `I recommend the **[${tool.name}](${tool.path})** utility.`,
        '',
        `### ✨ Capabilities:`,
        `* Combine 2 or more PDF documents into a single organized file.`,
        `* Drag-and-drop to reorder pages before merging.`,
        `* 100% Client-Side: Large PDF files merge securely without uploading.`,
        '',
        `Click the link above or use the card below to stage your PDF files!`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 2,
        description: 'Merge staged PDF documents in sequential order',
      },
    };
  }

  // PDF Split
  if (query.includes('split') && query.includes('pdf')) {
    const tool = TOOLS.find((t) => t.id === 'pdf-split')!;
    return {
      message: [
        `I recommend the **[${tool.name}](${tool.path})** utility.`,
        '',
        `You can extract individual pages or custom ranges (e.g. 1-3, 5, 8-10) into separate documents.`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 1,
        description: 'Split PDF pages into standalone documents',
      },
    };
  }

  // Images to PDF
  if ((query.includes('convert') || query.includes('turn')) && (query.includes('images') || query.includes('photos')) && query.includes('pdf')) {
    const tool = TOOLS.find((t) => t.id === 'images-to-pdf')!;
    return {
      message: [
        `I recommend **[${tool.name}](${tool.path})**.`,
        '',
        `Convert multiple photos, scans, and notes into a clean, printable PDF document with custom margins and orientation.`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 1,
        description: 'Convert staged photos to PDF document',
      },
    };
  }

  // SGPA / CGPA Calculation
  if (query.includes('sgpa') || query.includes('gpa') || query.includes('cgpa') || query.includes('grade point')) {
    const tool = query.includes('cgpa')
      ? (TOOLS.find((t) => t.id === 'cgpa-calculator') || TOOLS.find((t) => t.id === 'sgpa-calculator')!)
      : TOOLS.find((t) => t.id === 'sgpa-calculator')!;

    return {
      message: [
        `Here is the **[${tool.name}](${tool.path})** utility.`,
        '',
        `### 🎓 How it works:`,
        `* Enter course credits and letter grades or grade points.`,
        `* Supports standard 10-point and 4-point university grading scales.`,
        `* Automatically calculates your exact semester GPA and equivalent percentage.`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: { scale: '10' },
        filesRequiredCount: 0,
        description: 'Launch SGPA / CGPA Calculator',
      },
    };
  }

  // Attendance & Bunk Calculator
  if (query.includes('attendance') || query.includes('bunk') || query.includes('75 percent')) {
    const tool = TOOLS.find((t) => t.id === 'attendance-calculator')!;
    return {
      message: [
        `Here is the **[${tool.name}](${tool.path})** utility.`,
        '',
        `### 📊 How it works:`,
        `* Enter your total conducted classes and attended classes.`,
        `* Set your target attendance threshold (default 75%).`,
        `* It calculates exactly how many safe bunks you have left, or how many consecutive classes you must attend to recover!`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: { target: 75 },
        filesRequiredCount: 0,
        description: 'Launch Attendance Calculator with 75% target',
      },
    };
  }

  // EMI Calculator
  if (query.includes('emi') || query.includes('loan')) {
    const tool = TOOLS.find((t) => t.id === 'calc-emi') || TOOLS.find((t) => t.id === 'calc-standard')!;
    return {
      message: [
        `Here is the **[${tool.name}](${tool.path})** utility.`,
        '',
        `Calculate monthly installments, total interest payable, and full loan amortization schedules for home, car, or personal loans.`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 0,
        description: 'Launch EMI Loan Calculator',
      },
    };
  }

  // SIP Calculator
  if (query.includes('sip') || query.includes('mutual fund')) {
    const tool = TOOLS.find((t) => t.id === 'calc-sip') || TOOLS.find((t) => t.id === 'calc-standard')!;
    return {
      message: [
        `Here is the **[${tool.name}](${tool.path})** utility.`,
        '',
        `Project wealth creation through monthly Systematic Investment Plans (SIP) with compound growth projections.`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 0,
        description: 'Launch SIP Investment Calculator',
      },
    };
  }

  // GST Calculator
  if (query.includes('gst') || query.includes('tax')) {
    const tool = TOOLS.find((t) => t.id === 'calc-gst') || TOOLS.find((t) => t.id === 'calc-standard')!;
    return {
      message: [
        `Here is the **[${tool.name}](${tool.path})** utility.`,
        '',
        `Compute both GST-exclusive and GST-inclusive amounts with standard slabs (5%, 12%, 18%, 28%).`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 0,
        description: 'Launch GST Calculator',
      },
    };
  }

  // JSON formatting & validation
  if (query.includes('json') && (query.includes('format') || query.includes('beautify') || query.includes('validate') || query.includes('pretty'))) {
    const tool = TOOLS.find((t) => t.id === 'dev-json-formatter')!;
    return {
      message: [
        `Here is the **[${tool.name}](${tool.path})** utility.`,
        '',
        `Format, validate syntax, collapse keys, and beautify messy JSON payloads with 2-space or 4-space indentation.`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: { indent: 2 },
        filesRequiredCount: 0,
        description: 'Format and validate JSON payload',
      },
    };
  }

  // QR code generation
  if (query.includes('qr') || query.includes('qrcode')) {
    const tool = query.includes('wifi')
      ? (TOOLS.find((t) => t.id === 'qr-wifi') || TOOLS.find((t) => t.id === 'qr-generator')!)
      : TOOLS.find((t) => t.id === 'qr-generator')!;
    return {
      message: [
        `Here is the **[${tool.name}](${tool.path})** utility.`,
        '',
        `Generate high-resolution QR codes with custom foreground/background colors, logos, and export in PNG or SVG formats.`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 0,
        description: 'Generate customizable QR Code',
      },
    };
  }

  // Password Generator
  if (query.includes('password') && (query.includes('generate') || query.includes('make') || query.includes('random') || query.includes('strong'))) {
    const tool = TOOLS.find((t) => t.id === 'adv-password-generator') || TOOLS.find((t) => t.id === 'password-generator')!;
    return {
      message: [
        `Here is the **[${tool.name}](${tool.path})** utility.`,
        '',
        `Generate cryptographically secure passwords using the Web Crypto API (CSPRNG) with custom entropy, symbols, numbers, and length.`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: { length: 18 },
        filesRequiredCount: 0,
        description: 'Generate 18-character CSPRNG secure password',
      },
    };
  }

  // Word & Character Counter
  if (query.includes('count') && (query.includes('word') || query.includes('character') || query.includes('letter'))) {
    const tool = TOOLS.find((t) => t.id === 'word-counter')!;
    return {
      message: [
        `Here is the **[${tool.name}](${tool.path})** utility.`,
        '',
        `Analyze text length, word count, character count, sentence structure, and estimated speaking/reading time in real-time.`,
      ].join('\n'),
      actionPlan: {
        tool,
        parameters: {},
        filesRequiredCount: 0,
        description: 'Analyze word count, characters, and reading time',
      },
    };
  }

  // 5. SMART KEYWORD SEARCH AGAINST REGISTRY
  const matchingTools = TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(query) ||
      t.keywords.some((k) => query.includes(k.toLowerCase())) ||
      t.synonyms.some((s) => query.includes(s.toLowerCase()))
  );

  if (matchingTools.length > 1) {
    return {
      message: [
        `I found **${matchingTools.length} matching tools** for your request on ToolHub:`,
        '',
        ...matchingTools.map(formatToolBullet),
        '',
        `💡 *Click on any tool above or select from the connected cards below to get started!*`,
      ].join('\n'),
    };
  }

  if (matchingTools.length === 1) {
    const matchedTool = matchingTools[0];
    return {
      message: [
        `Based on your request, here is the recommended tool on ToolHub:`,
        '',
        `### 🛠️ [${matchedTool.name}](${matchedTool.path})`,
        `${matchedTool.description}`,
        '',
        `* **Category**: ${CATEGORIES[matchedTool.category]?.name || matchedTool.category}`,
        `* **Execution**: 100% In-Browser (${matchedTool.executionMode})`,
        `* **Requirements**: ${matchedTool.inputRequirements || 'None'}`,
        '',
        `Click the link above or open the card below to launch this utility!`,
      ].join('\n'),
      actionPlan: {
        tool: matchedTool,
        parameters: {},
        filesRequiredCount: matchedTool.supportedFormats && matchedTool.supportedFormats.length > 0 ? 1 : 0,
        description: `Execute ${matchedTool.name}`,
      },
    };
  }

  // 6. DEFAULT HELPFUL GEMINI/CHATGPT PROMPT
  return {
    message: [
      `I'm your **ToolHub Assistant**. I can help you find, launch, and execute utilities from our **400+ in-browser tools**.`,
      '',
      `Here are a few things you can ask me:`,
      `* *"Give me list of image tools"* or *"Show me PDF tools"*`,
      `* *"Compress this photo to under 50 KB"*`,
      `* *"Resize my signature to 300 by 100 pixels"*`,
      `* *"Merge these 3 PDF files"*`,
      `* *"Calculate my SGPA and attendance bunk count"*`,
      `* *"Generate a QR code for my Wi-Fi"*`,
      `* *"Format this JSON"*`,
      '',
      `What would you like to accomplish today?`,
    ].join('\n'),
  };
}
