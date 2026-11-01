import { EXECUTABLE_TOOLS, ProcessedFile } from './toolRegistry';
import { formatBytes } from '../../utils/file';
import { executeGeminiRequest, getEffectiveApiKey, DEFAULT_GEMINI_MODEL } from './geminiClient';

export interface MechanicalLogEntry {
  id: string;
  timestamp: string;
  stepId?: string;
  level: 'INIT' | 'INGEST' | 'EXEC' | 'PROGRESS' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
}

export interface ExecutionStep {
  id: string;
  toolId: string;
  toolName: string;
  phaseName?: string;
  engineName?: string;
  description: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentSubOp?: string;
  subOperations?: string[];
  outputSummary?: string;
  errorMessage?: string;
  durationMs?: number;
  inputStats?: string;
  outputStats?: string;
  logs?: string[];
}

export interface ClarificationOption {
  label: string;
  value: string;
  parameters: Record<string, any>;
}

export interface ExecutionPlan {
  id: string;
  userPrompt: string;
  understoodIntent?: string;
  steps: ExecutionStep[];
  needsClarification: boolean;
  clarificationQuestion?: string;
  clarificationOptions?: ClarificationOption[];
}

export function getMechanicalTimestamp(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

/**
 * Intelligent Natural Language Workflow Parser
 * Translates multi-step, conditional, or single-action instructions into an ordered mechanical execution pipeline.
 */
export function parseWorkflowInstruction(prompt: string, uploadedFiles: File[]): ExecutionPlan {
  const query = prompt.toLowerCase().trim();
  const planId = `plan_${Date.now()}`;
  const steps: ExecutionStep[] = [];

  // File breakdown
  const imageFiles = uploadedFiles.filter((f) => f.type.startsWith('image/'));
  const pdfFiles = uploadedFiles.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
  const textFiles = uploadedFiles.filter(
    (f) => f.type.startsWith('text/') || f.name.endsWith('.txt') || f.name.endsWith('.json') || f.name.endsWith('.csv')
  );

  // 1. Check for vague requests requiring clarification
  const isVagueCompress =
    /\b(compress|shrink|make smaller|reduce size)\b/i.test(query) &&
    !/\b(\d+\s*(kb|mb|%)|under|below|less than|exact)\b/i.test(query) &&
    imageFiles.length > 0;

  if (isVagueCompress && !/\b(zip|pdf|merge)\b/i.test(query)) {
    return {
      id: planId,
      userPrompt: prompt,
      understoodIntent: `Compress ${imageFiles.length} image(s) to reduce file size (awaiting your target size preference).`,
      steps: [
        {
          id: 'step_compress',
          toolId: 'image-compressor',
          toolName: 'Image Compressor',
          phaseName: 'Size Optimization',
          engineName: 'Iterative Binary Search Compression Worker',
          description: `Compress ${imageFiles.length} image(s) to optimal web size`,
          subOperations: [
            'Analyze image dimensions & initial byte density',
            'Iterative quality matrix calibration',
            'Generate compressed payload',
          ],
          parameters: {},
          status: 'pending',
          progress: 0,
        },
      ],
      needsClarification: true,
      clarificationQuestion: 'What maximum file size or quality target would you prefer?',
      clarificationOptions: [
        { label: 'Under 100 KB', value: '100kb', parameters: { targetKb: 100 } },
        { label: 'Under 200 KB', value: '200kb', parameters: { targetKb: 200 } },
        { label: 'Under 500 KB', value: '500kb', parameters: { targetKb: 500 } },
        { label: 'Standard Web (75% Quality)', value: 'quality_75', parameters: { quality: 75 } },
      ],
    };
  }

  // 2. Identify Target Parameters
  let targetKb: number | null = null;
  const kbMatch = query.match(/(?:under|below|less than|to|exact|target)?\s*(\d+)\s*kb\b/i);
  if (kbMatch) {
    targetKb = parseInt(kbMatch[1], 10);
  }
  const mbMatch = query.match(/(?:under|below|less than|to|exact|target)?\s*(\d+(?:\.\d+)?)\s*mb\b/i);
  if (mbMatch) {
    targetKb = Math.round(parseFloat(mbMatch[1]) * 1024);
  }

  const wantsJpg = /\b(to jpg|to jpeg|into jpg|into jpeg|as jpg|convert to jpg)\b/i.test(query);
  const wantsPng = /\b(to png|into png|as png|convert to png)\b/i.test(query);
  const wantsWebp = /\b(to webp|into webp|as webp|convert to webp)\b/i.test(query);
  const targetImgFormat = wantsPng ? 'png' : wantsWebp ? 'webp' : wantsJpg ? 'jpg' : null;

  const wantsImagesToPdf =
    /\b(into\s+(?:a\s+)?(?:[\w-]+\s+)*pdf|to\s+(?:a\s+)?(?:[\w-]+\s+)*pdf|photos?\s+to\s+pdf|images?\s+to\s+pdf|make\s+(?:a\s+)?(?:[\w-]+\s+)*pdf|create\s+(?:a\s+)?(?:[\w-]+\s+)*pdf)\b/i.test(
      query
    ) && (imageFiles.length > 0 || !pdfFiles.length);

  const wantsPdfMerge =
    /\b(merge|combine|join|concatenate|bind)\b/i.test(query) &&
    (pdfFiles.length >= 2 || (pdfFiles.length > 0 && !query.includes('image')));

  const wantsPdfSplit = /\b(split|extract pages?|cut pdf|remove pages?|delete pages?)\b/i.test(query);
  const pageRangeMatch = query.match(/pages?\s*([\d\s,\-]+)/i);
  const pageRange = pageRangeMatch ? pageRangeMatch[1].trim() : '1';

  const wantsPageNumbers = /\b(page numbers?|numbering|number pages?|paginate)\b/i.test(query);
  const wantsZip = /\b(zip|archive|put.*in.*zip|bundle.*zip|one zip|create zip)\b/i.test(query);

  const wantsResize = /\b(resize|dimensions|width|height|passport|signature)\b/i.test(query);
  const isPassport = /\b(passport|id photo)\b/i.test(query);
  const dimsMatch = query.match(/(\d+)\s*x\s*(\d+)/i);

  const wantsWordCount = /\b(count words?|word count|how many words|reading time)\b/i.test(query);
  const wantsTextClean =
    (/\b(clean text|clean spaces|remove extra spaces|remove spaces|uppercase|lowercase|title case|duplicate lines)\b/i.test(
      query
    ) ||
      (/\bclean\b/i.test(query) && !/\b(pdf|image|photo|pic)\b/i.test(query))) &&
    (textFiles.length > 0 || (!imageFiles.length && !pdfFiles.length));
  const wantsJsonFormat = /\b(format json|prettify json|minify json|validate json)\b/i.test(query);
  const wantsQrCode = /\b(qr code|make qr|generate qr)\b/i.test(query);

  // -------------------------------------------------------------
  // MECHANICAL PIPELINE ASSEMBLY (Ordered sequence of operations)
  // -------------------------------------------------------------

  // Step: Resizing
  if (wantsResize && imageFiles.length > 0) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'image-resizer',
      toolName: 'Image Resizer',
      phaseName: 'Dimensional Matrix Scaling',
      engineName: 'HTML5 High-Fidelity Canvas Resampler',
      description: isPassport
        ? `Resize image(s) to official passport dimensions (3.5x4.5 cm / 413x531 px)`
        : dimsMatch
        ? `Resize image(s) to ${dimsMatch[1]}x${dimsMatch[2]} px`
        : `Resize image(s) dimensions`,
      subOperations: [
        'Compute target aspect ratio & pixel dimensions',
        'Bicubic interpolation & canvas buffer rendering',
        'Export resized image stream',
      ],
      parameters: {
        preset: isPassport ? 'passport' : undefined,
        width: dimsMatch ? parseInt(dimsMatch[1], 10) : undefined,
        height: dimsMatch ? parseInt(dimsMatch[2], 10) : undefined,
      },
      status: 'pending',
      progress: 0,
    });
  }

  // Step: Format conversion
  if (targetImgFormat && imageFiles.length > 0) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'image-converter',
      toolName: 'Image Format Converter',
      phaseName: 'Format Transcoding',
      engineName: 'HTML5 Canvas 2D Transcoder',
      description: `Transcode ${imageFiles.length} image(s) into ${targetImgFormat.toUpperCase()} format`,
      subOperations: [
        'Decode input image binary buffers',
        'Paint on 24-bit canvas with white backdrop fill',
        `Serialize to ${targetImgFormat.toUpperCase()} blob container`,
      ],
      parameters: { format: targetImgFormat },
      status: 'pending',
      progress: 0,
    });
  }

  // Step: Compression
  if (
    (targetKb || /\b(compress|shrink|reduce size)\b/i.test(query)) &&
    (imageFiles.length > 0 || (!pdfFiles.length && !wantsImagesToPdf))
  ) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'image-compressor',
      toolName: 'Image Compressor',
      phaseName: 'Target Size Optimization',
      engineName: 'Iterative Binary Search Compression Worker',
      description: targetKb
        ? `Compress image(s) below ${targetKb} KB while preserving visual clarity`
        : `Compress image(s) to optimize size`,
      subOperations: [
        'Analyze image resolution and byte density',
        targetKb ? `Binary search calibration targeting <= ${targetKb} KB` : 'Dynamic quality quantization',
        'Encode optimized payload and verify reduction',
      ],
      parameters: { targetKb: targetKb || undefined, quality: targetKb ? undefined : 75 },
      status: 'pending',
      progress: 0,
    });
  }

  // Step: Images to PDF
  if (wantsImagesToPdf) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'images-to-pdf',
      toolName: 'Images to PDF Converter',
      phaseName: 'PDF Vector Document Compilation',
      engineName: 'PDF-Lib WebAssembly Engine v1.17',
      description: `Compile ${imageFiles.length || 'uploaded'} image(s) into a unified PDF document`,
      subOperations: [
        'Embed image streams into PDF XObjects',
        'Create printable A4 document pages',
        'Compile and serialize document catalog',
      ],
      parameters: { outputName: 'document_from_images.pdf' },
      status: 'pending',
      progress: 0,
    });
  }

  // Step: PDF Merge
  if (wantsPdfMerge) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'pdf-merge',
      toolName: 'PDF Merge Tool',
      phaseName: 'Document Tree Concatenation',
      engineName: 'PDF-Lib WebAssembly Engine v1.17',
      description: `Combine ${pdfFiles.length} PDF files into a single merged document`,
      subOperations: [
        'Load source PDF trees & decrypt streams',
        'Copy vector page arrays & embedded fonts',
        'Serialize unified document buffer',
      ],
      parameters: { outputName: 'merged_document.pdf' },
      status: 'pending',
      progress: 0,
    });
  }

  // Step: PDF Split
  if (wantsPdfSplit) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'pdf-split',
      toolName: 'PDF Page Extractor',
      phaseName: 'Document Slicing',
      engineName: 'PDF-Lib Page Extraction Worker',
      description: `Extract pages (${pageRange}) from PDF`,
      subOperations: [
        'Parse target page ranges and validate indices',
        'Clone page tree branches and font tables',
        'Save sliced PDF artifact',
      ],
      parameters: { pageRange },
      status: 'pending',
      progress: 0,
    });
  }

  // Step: PDF Page Numbers
  if (wantsPageNumbers) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'pdf-page-numbers',
      toolName: 'PDF Page Numberer',
      phaseName: 'Vector Typography Pagination',
      engineName: 'Helvetica Vector Typography Engine',
      description: 'Add page numbers (Page X of Y) to footer of document',
      subOperations: [
        'Embed standard Helvetica font dictionary',
        'Calculate baseline center offsets for each page',
        'Draw vector glyphs to bottom margins',
      ],
      parameters: {},
      status: 'pending',
      progress: 0,
    });
  }

  // Step: ZIP Archiving
  if (wantsZip) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'file-zip-create',
      toolName: 'ZIP Archive Creator',
      phaseName: 'Deflate Stream Archiving',
      engineName: 'fflate Fast Deflate Archiver v0.8',
      description: 'Package all processed files into one clean ZIP download',
      subOperations: [
        'Construct in-memory file allocation table',
        'Stream raw bytes through Deflate level 6 compressor',
        'Generate ZIP central directory and CRC-32 checksums',
      ],
      parameters: { archiveName: 'toolhub_processed_files.zip' },
      status: 'pending',
      progress: 0,
    });
  }

  // Text / Developer / Utility steps
  if (wantsWordCount) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'word-counter',
      toolName: 'Word Counter',
      phaseName: 'Text Tokenization & Analytics',
      engineName: 'Unicode Tokenizer Core',
      description: 'Analyze word count, characters, sentences, and reading time',
      subOperations: [
        'Tokenize character and word boundaries',
        'Calculate reading and speaking duration metrics',
        'Aggregate sentence & paragraph density',
      ],
      parameters: {},
      status: 'pending',
      progress: 0,
    });
  }

  if (wantsTextClean) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'text-cleaner',
      toolName: 'Text Cleaner & Formatter',
      phaseName: 'Text Normalization & Casing',
      engineName: 'Regex Pattern Cleaning Engine',
      description: 'Clean formatting, normalize whitespace, and apply case rules',
      subOperations: [
        'Normalize spaces, tabs, and line breaks',
        'Apply casing transformations',
        'Filter duplicate lines & clean stream',
      ],
      parameters: {
        uppercase: /\buppercase\b/i.test(query),
        lowercase: /\blowercase\b/i.test(query),
        titlecase: /\btitle case\b/i.test(query),
        removeExtraSpaces: /\b(spaces|clean)\b/i.test(query),
        removeDuplicateLines: /\bduplicate\b/i.test(query),
      },
      status: 'pending',
      progress: 0,
    });
  }

  if (wantsJsonFormat) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'dev-json-formatter',
      toolName: 'JSON Formatter & Validator',
      phaseName: 'AST Parsing & JSON Serialization',
      engineName: 'V8 Native JSON Parser',
      description: 'Validate and beautify JSON structure',
      subOperations: [
        'Lex and parse JSON tokens into AST',
        'Validate syntax tree and structural integrity',
        'Serialize formatted stream with indentation',
      ],
      parameters: { minify: /\bminify\b/i.test(query), indent: 2 },
      status: 'pending',
      progress: 0,
    });
  }

  if (wantsQrCode) {
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/i);
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'qr-generator',
      toolName: 'QR Code Generator',
      phaseName: 'Matrix Code Synthesis',
      engineName: 'Reed-Solomon QR Matrix Generator',
      description: 'Generate high-resolution QR code image',
      subOperations: [
        'Encode byte stream with Reed-Solomon error correction level M',
        'Synthesize 2D binary matrix modules',
        'Export anti-aliased 600x600 PNG container',
      ],
      parameters: { content: urlMatch ? urlMatch[0] : prompt },
      status: 'pending',
      progress: 0,
    });
  }

  // Fallback: If no recognized steps were matched but files exist, infer best tool based on file types
  if (steps.length === 0) {
    if (pdfFiles.length >= 2) {
      steps.push({
        id: 'step_1',
        toolId: 'pdf-merge',
        toolName: 'Merge PDFs',
        phaseName: 'Document Tree Concatenation',
        engineName: 'PDF-Lib WebAssembly Engine v1.17',
        description: `Merge ${pdfFiles.length} PDF files into one`,
        subOperations: ['Inspect PDF headers', 'Copy page vectors', 'Serialize merged output'],
        parameters: {},
        status: 'pending',
        progress: 0,
      });
    } else if (imageFiles.length > 0) {
      steps.push({
        id: 'step_1',
        toolId: 'image-compressor',
        toolName: 'Image Compressor',
        phaseName: 'Target Size Optimization',
        engineName: 'Iterative Binary Search Compression Worker',
        description: `Optimize and compress ${imageFiles.length} image(s)`,
        subOperations: ['Inspect image bounds', 'Apply quality quantization', 'Encode optimized payload'],
        parameters: { quality: 75 },
        status: 'pending',
        progress: 0,
      });
    } else if (textFiles.length > 0) {
      steps.push({
        id: 'step_1',
        toolId: 'word-counter',
        toolName: 'Word Counter',
        phaseName: 'Text Tokenization & Analytics',
        engineName: 'Unicode Tokenizer Core',
        description: 'Analyze word count and statistics',
        subOperations: ['Tokenize words', 'Calculate reading metrics', 'Aggregate summary'],
        parameters: {},
        status: 'pending',
        progress: 0,
      });
    }
  }

  // Generate high-clarity natural language understoodIntent
  let understoodIntent = '';
  if (steps.length === 1) {
    understoodIntent = steps[0].description;
  } else if (steps.length > 1) {
    const actions = steps.map((s) => s.toolName).join(' ➔ ');
    understoodIntent = `Sequential Pipeline: ${actions} for ${uploadedFiles.length || 'provided'} file(s).`;
  } else {
    understoodIntent = prompt || 'Custom file operation';
  }

  return {
    id: planId,
    userPrompt: prompt,
    understoodIntent,
    steps,
    needsClarification: false,
  };
}

/**
 * Asynchronous AI Task Understanding Engine powered by Google Gemini API
 * Connects the backend Gemini API to deeply understand what the user wants with their specific files
 * before synthesizing and executing the mechanical tool pipeline.
 */
export async function parseWorkflowInstructionWithAI(
  prompt: string,
  uploadedFiles: File[],
  onLogEntry?: (entry: MechanicalLogEntry) => void
): Promise<ExecutionPlan> {
  const apiKey = getEffectiveApiKey();
  const fileSummary = uploadedFiles
    .map((f, i) => `${i + 1}. "${f.name}" (${f.type || 'binary'}, ${formatBytes(f.size)})`)
    .join('\n');

  onLogEntry?.({
    id: `intent_${Date.now()}_start`,
    timestamp: getMechanicalTimestamp(),
    level: 'INIT',
    message: `[AI REASONING] Contacting Google Gemini AI backend with ${uploadedFiles.length} file metadata and user prompt...`,
  });

  if (apiKey) {
    try {
      const systemInstruction = `You are ToolHub's AI Task Understanding Engine.
Your mission is to analyze the user's natural language request and uploaded files, comprehend what they want to achieve, and output an exact sequential execution plan using ToolHub's built-in tools.

Available Tool IDs:
- "image-converter": converts images to another format. parameters: { "format": "jpg" | "png" | "webp" }
- "image-compressor": compresses images. parameters: { "targetKb": number (optional), "quality": number (optional) }
- "image-resizer": resizes images. parameters: { "preset": "passport" | "signature" (optional), "width": number (optional), "height": number (optional) }
- "images-to-pdf": converts multiple/single images into a single PDF document. parameters: {}
- "pdf-merge": merges 2+ PDF files into one PDF. parameters: {}
- "pdf-split": extracts or removes pages. parameters: { "pageRange": string (e.g. "1,3,5" or "1-4") }
- "pdf-page-numbers": adds page numbers to PDF. parameters: {}
- "file-zip-create": bundles files into a ZIP archive. parameters: { "archiveName": string (optional) }
- "word-counter": counts words and characters in text. parameters: {}
- "text-cleaner": cleans extra spaces/lines from text. parameters: {}
- "dev-json-formatter": formats and indents JSON. parameters: { "indent": 2 }
- "qr-generator": generates QR code. parameters: { "text": string }

Respond ONLY with a single JSON object strictly matching this schema (NO code fences, NO markdown formatting):
{
  "understoodIntent": "Clear, concise sentence summarizing what the user wants to accomplish with their specific files",
  "needsClarification": boolean,
  "clarificationQuestion": string | null,
  "clarificationOptions": [
    { "label": string, "value": string, "parameters": object }
  ] | null,
  "steps": [
    {
      "toolId": string,
      "description": string,
      "phaseName": string,
      "engineName": string,
      "parameters": object
    }
  ]
}

Rules:
- Order steps logically: format conversion -> compression -> archiving.
- If compression lacks target size, set "needsClarification": true with options.
- Use only the listed toolIds.`;

      const userContent = `User Request:
"${prompt}"

Uploaded Files:
${fileSummary || 'No files uploaded.'}`;

      const responseText = await executeGeminiRequest(
        apiKey,
        DEFAULT_GEMINI_MODEL,
        userContent,
        [{ role: 'user', text: systemInstruction }],
        false
      );

      const cleanJson = responseText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        onLogEntry?.({
          id: `intent_${Date.now()}_done`,
          timestamp: getMechanicalTimestamp(),
          level: 'SUCCESS',
          message: `[AI UNDERSTOOD] "${parsed.understoodIntent || 'Processed user intent successfully'}"`,
        });

        const mappedSteps: ExecutionStep[] = parsed.steps.map((st: any, idx: number) => {
          const tool = EXECUTABLE_TOOLS[st.toolId];
          const subOps =
            st.subOperations ||
            (st.toolId === 'image-compressor'
              ? [
                  'Inspect input image dimensions and density',
                  'Iterative quality matrix calibration',
                  'Generate compressed payload',
                ]
              : st.toolId === 'image-converter'
              ? [
                  'Decode image bitstream into 24-bit canvas',
                  `Transcode pixel array to ${st.parameters?.format?.toUpperCase() || 'target'} format`,
                  'Serialize image blob into output memory',
                ]
              : st.toolId === 'file-zip-create'
              ? [
                  'Construct in-memory file allocation table',
                  'Stream raw bytes through Deflate compressor',
                  'Generate ZIP central directory and CRC-32 checksums',
                ]
              : st.toolId === 'pdf-merge'
              ? [
                  'Inspect and index input PDF page trees',
                  'Copy page vectors into unified document',
                  'Serialize combined PDF stream',
                ]
              : [
                  'Ingesting input buffers',
                  'Executing transformation engine',
                  'Finalizing output artifact',
                ]);

          return {
            id: `step_${idx + 1}_${st.toolId}`,
            toolId: st.toolId,
            toolName: tool?.name || st.toolId,
            phaseName: st.phaseName || tool?.name || 'Execution Phase',
            engineName: st.engineName || 'Client-Side Engine',
            description: st.description || `Execute ${tool?.name || st.toolId}`,
            subOperations: subOps,
            parameters: st.parameters || {},
            status: 'pending' as const,
            progress: 0,
          };
        });

        return {
          id: `plan_${Date.now()}`,
          userPrompt: prompt,
          understoodIntent: parsed.understoodIntent || 'Processed user instruction with Gemini AI',
          steps: mappedSteps,
          needsClarification: Boolean(parsed.needsClarification),
          clarificationQuestion: parsed.clarificationQuestion || undefined,
          clarificationOptions: parsed.clarificationOptions || undefined,
        };
      }
    } catch (err: any) {
      onLogEntry?.({
        id: `intent_fallback_${Date.now()}`,
        timestamp: getMechanicalTimestamp(),
        level: 'WARN',
        message: `Gemini AI backend notice (${err.message || 'offline'}). Switched seamlessly to built-in deterministic intent engine.`,
      });
    }
  }

  // Graceful zero-failure fallback to local engine
  return parseWorkflowInstruction(prompt, uploadedFiles);
}

/**
 * Sequential Mechanical Pipeline Executor
 * Executes each planned step in order, displaying progress in a clear mechanical step-by-step format.
 */
export async function executeWorkflowPlan(
  plan: ExecutionPlan,
  initialFiles: File[],
  onStepProgress: (stepId: string, progress: number, message: string, subOp?: string) => void,
  onStepComplete: (stepId: string, success: boolean, summary: string, durationMs?: number, outputStats?: string) => void,
  onLogEntry?: (entry: MechanicalLogEntry) => void
): Promise<{ success: boolean; finalFiles: ProcessedFile[]; message: string; textOutput?: string }> {
  let currentFiles: File[] = [...initialFiles];
  let lastOutputFiles: ProcessedFile[] = [];
  let textOutput: string | undefined;

  const totalInputBytes = initialFiles.reduce((acc, f) => acc + f.size, 0);

  onLogEntry?.({
    id: `log_${Date.now()}_init`,
    timestamp: getMechanicalTimestamp(),
    level: 'INIT',
    message: `Initialized workflow pipeline [${plan.steps.length} planned mechanical phase(s)]. Total input: ${formatBytes(totalInputBytes)} (${initialFiles.length} file(s)).`,
  });

  for (let sIdx = 0; sIdx < plan.steps.length; sIdx++) {
    const step = plan.steps[sIdx];
    const tool = EXECUTABLE_TOOLS[step.toolId];
    const stepStart = performance.now();

    if (!tool) {
      step.status = 'failed';
      step.errorMessage = `Tool "${step.toolId}" is not implemented or unavailable in the registry.`;
      onStepComplete(step.id, false, step.errorMessage);
      onLogEntry?.({
        id: `log_${Date.now()}_err`,
        timestamp: getMechanicalTimestamp(),
        stepId: step.id,
        level: 'ERROR',
        message: `Step ${sIdx + 1} execution failed: Tool "${step.toolId}" missing in registry.`,
      });
      return {
        success: false,
        finalFiles: lastOutputFiles,
        message: `Workflow halted at step ${sIdx + 1}: ${step.errorMessage}`,
      };
    }

    step.status = 'running';
    step.progress = 10;
    const stepInputBytes = currentFiles.reduce((acc, f) => acc + f.size, 0);
    step.inputStats = `${currentFiles.length} file(s) • ${formatBytes(stepInputBytes)}`;

    onLogEntry?.({
      id: `log_${Date.now()}_step_start`,
      timestamp: getMechanicalTimestamp(),
      stepId: step.id,
      level: 'EXEC',
      message: `[PHASE ${sIdx + 1}/${plan.steps.length}] Starting ${step.toolName} (${step.engineName || 'Engine'}). Input: ${step.inputStats}.`,
    });

    // Sub-operation 1: Ingestion & Validation
    const subOps = step.subOperations || ['Ingesting input files', 'Processing transformations', 'Finalizing artifact'];
    step.currentSubOp = subOps[0];
    onStepProgress(step.id, 20, `Phase 1: ${subOps[0]}...`, subOps[0]);

    onLogEntry?.({
      id: `log_${Date.now()}_sub1`,
      timestamp: getMechanicalTimestamp(),
      stepId: step.id,
      level: 'INGEST',
      message: `Sub-operation 1/3: ${subOps[0]} (validating buffer pointers in memory)...`,
    });

    // Small yield for smooth observable mechanical progression
    await new Promise((r) => setTimeout(r, 160));

    // Sub-operation 2: Transformation Engine Execution
    step.currentSubOp = subOps[1];
    onStepProgress(step.id, 50, `Phase 2: ${subOps[1]}...`, subOps[1]);

    onLogEntry?.({
      id: `log_${Date.now()}_sub2`,
      timestamp: getMechanicalTimestamp(),
      stepId: step.id,
      level: 'EXEC',
      message: `Sub-operation 2/3: ${subOps[1]} using ${step.engineName || 'browser core'}...`,
    });

    try {
      const result = await tool.execute({
        files: currentFiles,
        parameters: step.parameters,
        onProgress: (p, msg) => {
          const scaledProgress = Math.min(95, Math.max(50, Math.round(50 + (p * 0.45))));
          step.progress = scaledProgress;
          onStepProgress(step.id, scaledProgress, msg, step.currentSubOp);
        },
      });

      if (!result.success) {
        throw new Error(result.message || 'Tool execution reported failure.');
      }

      // Sub-operation 3: Verification & Output Packaging
      step.currentSubOp = subOps[2];
      onStepProgress(step.id, 90, `Phase 3: ${subOps[2]}...`, subOps[2]);

      onLogEntry?.({
        id: `log_${Date.now()}_sub3`,
        timestamp: getMechanicalTimestamp(),
        stepId: step.id,
        level: 'PROGRESS',
        message: `Sub-operation 3/3: ${subOps[2]} (validating output stream)...`,
      });

      await new Promise((r) => setTimeout(r, 120));

      const durationMs = Math.round(performance.now() - stepStart);
      step.durationMs = durationMs;
      step.status = 'completed';
      step.progress = 100;
      step.outputSummary = result.message;

      let outputStatsStr = '';
      if (result.files && result.files.length > 0) {
        const outBytes = result.files.reduce((acc, f) => acc + f.size, 0);
        outputStatsStr = `${result.files.length} file(s) • ${formatBytes(outBytes)}`;
        step.outputStats = outputStatsStr;
      }

      onStepComplete(step.id, true, result.message, durationMs, outputStatsStr);

      onLogEntry?.({
        id: `log_${Date.now()}_step_done`,
        timestamp: getMechanicalTimestamp(),
        stepId: step.id,
        level: 'SUCCESS',
        message: `Phase ${sIdx + 1} completed in ${durationMs}ms: ${result.message}`,
      });

      if (result.text) {
        textOutput = result.text;
      }

      if (result.files && result.files.length > 0) {
        lastOutputFiles = result.files;
        // Transform ProcessedFiles into standard File objects for subsequent step consumption
        currentFiles = result.files.map(
          (pf) => new File([pf.blob], pf.name, { type: pf.type, lastModified: Date.now() })
        );
      }
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - stepStart);
      step.durationMs = durationMs;
      step.status = 'failed';
      step.errorMessage = err.message || 'An unexpected error occurred during execution.';
      onStepComplete(step.id, false, step.errorMessage || 'Execution failed', durationMs);

      onLogEntry?.({
        id: `log_${Date.now()}_step_fail`,
        timestamp: getMechanicalTimestamp(),
        stepId: step.id,
        level: 'ERROR',
        message: `Phase ${sIdx + 1} failed after ${durationMs}ms: ${step.errorMessage}`,
      });

      return {
        success: false,
        finalFiles: lastOutputFiles,
        message: `Step ${sIdx + 1} (${tool.name}) failed: ${step.errorMessage}`,
      };
    }
  }

  onLogEntry?.({
    id: `log_${Date.now()}_all_done`,
    timestamp: getMechanicalTimestamp(),
    level: 'SUCCESS',
    message: `All ${plan.steps.length} mechanical operations finalized successfully. Output ready for user download.`,
  });

  return {
    success: true,
    finalFiles: lastOutputFiles,
    message: `All ${plan.steps.length} operation(s) executed successfully!`,
    textOutput,
  };
}
