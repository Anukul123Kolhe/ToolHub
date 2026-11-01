import { EXECUTABLE_TOOLS, ProcessedFile } from './toolRegistry';

export interface ExecutionStep {
  id: string;
  toolId: string;
  toolName: string;
  description: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  outputSummary?: string;
  errorMessage?: string;
}

export interface ClarificationOption {
  label: string;
  value: string;
  parameters: Record<string, any>;
}

export interface ExecutionPlan {
  id: string;
  userPrompt: string;
  steps: ExecutionStep[];
  needsClarification: boolean;
  clarificationQuestion?: string;
  clarificationOptions?: ClarificationOption[];
}

/**
 * Intelligent Natural Language Workflow Parser
 * Translates multi-step, conditional, or single-action instructions into an ordered execution pipeline.
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
      steps: [
        {
          id: 'step_compress',
          toolId: 'image-compressor',
          toolName: 'Image Compressor',
          description: `Compress ${imageFiles.length} image(s)`,
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
  // KB extraction (e.g., "below 100 kb", "under 50KB", "to 200kb")
  let targetKb: number | null = null;
  const kbMatch = query.match(/(?:under|below|less than|to|exact|target)?\s*(\d+)\s*kb\b/i);
  if (kbMatch) {
    targetKb = parseInt(kbMatch[1], 10);
  }
  const mbMatch = query.match(/(?:under|below|less than|to|exact|target)?\s*(\d+(?:\.\d+)?)\s*mb\b/i);
  if (mbMatch) {
    targetKb = Math.round(parseFloat(mbMatch[1]) * 1024);
  }

  // Format conversion extraction (e.g., "convert into jpg", "to png", "to webp")
  const wantsJpg = /\b(to jpg|to jpeg|into jpg|into jpeg|as jpg|convert to jpg)\b/i.test(query);
  const wantsPng = /\b(to png|into png|as png|convert to png)\b/i.test(query);
  const wantsWebp = /\b(to webp|into webp|as webp|convert to webp)\b/i.test(query);
  const targetImgFormat = wantsPng ? 'png' : wantsWebp ? 'webp' : wantsJpg ? 'jpg' : null;

  // Images to PDF conversion
  const wantsImagesToPdf =
    /\b(into\s+(?:a\s+)?(?:[\w-]+\s+)*pdf|to\s+(?:a\s+)?(?:[\w-]+\s+)*pdf|photos?\s+to\s+pdf|images?\s+to\s+pdf|make\s+(?:a\s+)?(?:[\w-]+\s+)*pdf|create\s+(?:a\s+)?(?:[\w-]+\s+)*pdf)\b/i.test(
      query
    ) && (imageFiles.length > 0 || !pdfFiles.length);

  // PDF Merge
  const wantsPdfMerge =
    /\b(merge|combine|join|concatenate|bind)\b/i.test(query) &&
    (pdfFiles.length >= 2 || (pdfFiles.length > 0 && !query.includes('image')));

  // PDF Split / Extract
  const wantsPdfSplit = /\b(split|extract pages?|cut pdf|remove pages?|delete pages?)\b/i.test(query);
  const pageRangeMatch = query.match(/pages?\s*([\d\s,\-]+)/i);
  const pageRange = pageRangeMatch ? pageRangeMatch[1].trim() : '1';

  // PDF Page Numbers
  const wantsPageNumbers = /\b(page numbers?|numbering|number pages?|paginate)\b/i.test(query);

  // ZIP Archiving
  const wantsZip = /\b(zip|archive|put.*in.*zip|bundle.*zip|one zip|create zip)\b/i.test(query);

  // Resizing
  const wantsResize = /\b(resize|dimensions|width|height|passport|signature)\b/i.test(query);
  const isPassport = /\b(passport|id photo)\b/i.test(query);
  const dimsMatch = query.match(/(\d+)\s*x\s*(\d+)/i);

  // Text / JSON / Utilities
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
  // PIPELINE ASSEMBLY (Correct logical sequence of operations)
  // -------------------------------------------------------------

  // If resizing images is part of the request
  if (wantsResize && imageFiles.length > 0) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'image-resizer',
      toolName: 'Image Resizer',
      description: isPassport
        ? `Resize image(s) to official passport size (3.5x4.5 cm / 413x531 px)`
        : dimsMatch
        ? `Resize image(s) to ${dimsMatch[1]}x${dimsMatch[2]} px`
        : `Resize image(s) dimensions`,
      parameters: {
        preset: isPassport ? 'passport' : undefined,
        width: dimsMatch ? parseInt(dimsMatch[1], 10) : undefined,
        height: dimsMatch ? parseInt(dimsMatch[2], 10) : undefined,
      },
      status: 'pending',
      progress: 0,
    });
  }

  // If format conversion is requested
  if (targetImgFormat && imageFiles.length > 0) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'image-converter',
      toolName: 'Image Format Converter',
      description: `Convert ${imageFiles.length} image(s) into ${targetImgFormat.toUpperCase()} format`,
      parameters: { format: targetImgFormat },
      status: 'pending',
      progress: 0,
    });
  }

  // If compression is requested
  if (
    (targetKb || /\b(compress|shrink|reduce size)\b/i.test(query)) &&
    (imageFiles.length > 0 || (!pdfFiles.length && !wantsImagesToPdf))
  ) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'image-compressor',
      toolName: 'Image Compressor',
      description: targetKb
        ? `Compress image(s) below ${targetKb} KB while preserving clarity`
        : `Compress image(s) to optimize size`,
      parameters: { targetKb: targetKb || undefined, quality: targetKb ? undefined : 75 },
      status: 'pending',
      progress: 0,
    });
  }

  // If Images to PDF is requested
  if (wantsImagesToPdf) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'images-to-pdf',
      toolName: 'Images to PDF Converter',
      description: `Compile ${imageFiles.length || 'uploaded'} image(s) into a unified PDF document`,
      parameters: { outputName: 'document_from_images.pdf' },
      status: 'pending',
      progress: 0,
    });
  }

  // If PDF Merge is requested
  if (wantsPdfMerge) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'pdf-merge',
      toolName: 'PDF Merge Tool',
      description: `Combine ${pdfFiles.length} PDF files into a single merged document`,
      parameters: { outputName: 'merged_document.pdf' },
      status: 'pending',
      progress: 0,
    });
  }

  // If PDF Split is requested
  if (wantsPdfSplit) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'pdf-split',
      toolName: 'PDF Page Extractor',
      description: `Extract pages (${pageRange}) from PDF`,
      parameters: { pageRange },
      status: 'pending',
      progress: 0,
    });
  }

  // If PDF Page Numbers requested
  if (wantsPageNumbers) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'pdf-page-numbers',
      toolName: 'PDF Page Numberer',
      description: 'Add page numbers (Page X of Y) to footer of document',
      parameters: {},
      status: 'pending',
      progress: 0,
    });
  }

  // If ZIP packaging is requested
  if (wantsZip) {
    steps.push({
      id: `step_${steps.length + 1}`,
      toolId: 'file-zip-create',
      toolName: 'ZIP Archive Creator',
      description: 'Package all processed files into one clean ZIP download',
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
      description: 'Analyze word count, characters, sentences, and reading time',
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
      description: 'Clean formatting, normalize whitespace, and apply case rules',
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
      description: 'Validate and beautify JSON structure',
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
      description: 'Generate high-resolution QR code image',
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
        description: `Merge ${pdfFiles.length} PDF files into one`,
        parameters: {},
        status: 'pending',
        progress: 0,
      });
    } else if (imageFiles.length > 0) {
      steps.push({
        id: 'step_1',
        toolId: 'image-compressor',
        toolName: 'Image Compressor',
        description: `Optimize and compress ${imageFiles.length} image(s)`,
        parameters: { quality: 75 },
        status: 'pending',
        progress: 0,
      });
    } else if (textFiles.length > 0) {
      steps.push({
        id: 'step_1',
        toolId: 'word-counter',
        toolName: 'Word Counter',
        description: 'Analyze word count and statistics',
        parameters: {},
        status: 'pending',
        progress: 0,
      });
    }
  }

  return {
    id: planId,
    userPrompt: prompt,
    steps,
    needsClarification: false,
  };
}

/**
 * Sequential Pipeline Executor
 * Executes each planned step in order, forwarding the output files of step N to step N+1.
 */
export async function executeWorkflowPlan(
  plan: ExecutionPlan,
  initialFiles: File[],
  onStepProgress: (stepId: string, progress: number, message: string) => void,
  onStepComplete: (stepId: string, success: boolean, summary: string) => void
): Promise<{ success: boolean; finalFiles: ProcessedFile[]; message: string; textOutput?: string }> {
  let currentFiles: File[] = [...initialFiles];
  let lastOutputFiles: ProcessedFile[] = [];
  let textOutput: string | undefined;

  for (let sIdx = 0; sIdx < plan.steps.length; sIdx++) {
    const step = plan.steps[sIdx];
    const tool = EXECUTABLE_TOOLS[step.toolId];

    if (!tool) {
      step.status = 'failed';
      step.errorMessage = `Tool "${step.toolId}" is not implemented or unavailable in the registry.`;
      onStepComplete(step.id, false, step.errorMessage);
      return {
        success: false,
        finalFiles: lastOutputFiles,
        message: `Workflow halted at step ${sIdx + 1}: ${step.errorMessage}`,
      };
    }

    step.status = 'running';
    step.progress = 10;
    onStepProgress(step.id, 10, `Starting ${tool.name}...`);

    try {
      const result = await tool.execute({
        files: currentFiles,
        parameters: step.parameters,
        onProgress: (p, msg) => {
          step.progress = p;
          onStepProgress(step.id, p, msg);
        },
      });

      if (!result.success) {
        throw new Error(result.message || 'Tool execution reported failure.');
      }

      step.status = 'completed';
      step.progress = 100;
      step.outputSummary = result.message;
      onStepComplete(step.id, true, result.message);

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
      step.status = 'failed';
      step.errorMessage = err.message || 'An unexpected error occurred during execution.';
      onStepComplete(step.id, false, step.errorMessage || 'Execution failed');
      return {
        success: false,
        finalFiles: lastOutputFiles,
        message: `Step ${sIdx + 1} (${tool.name}) failed: ${step.errorMessage}`,
      };
    }
  }

  return {
    success: true,
    finalFiles: lastOutputFiles,
    message: `All ${plan.steps.length} operation(s) executed successfully!`,
    textOutput,
  };
}
