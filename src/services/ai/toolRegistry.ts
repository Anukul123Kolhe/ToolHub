import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { zip, unzip } from 'fflate';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import DiffMatchPatch from 'diff-match-patch';

export interface ProcessedFile {
  name: string;
  blob: Blob;
  url: string;
  type: string;
  size: number;
  originalSize?: number;
  width?: number;
  height?: number;
}

export interface ToolExecutionInput {
  files: File[];
  text?: string;
  parameters: Record<string, any>;
  onProgress?: (progress: number, message: string) => void;
}

export interface ToolExecutionOutput {
  success: boolean;
  message: string;
  files: ProcessedFile[];
  text?: string;
  data?: any;
  stats?: Record<string, any>;
}

export interface ExecutableTool {
  id: string;
  name: string;
  category: 'pdf' | 'image' | 'media' | 'text' | 'developer' | 'qr' | 'calculator' | 'student';
  description: string;
  keywords: string[];
  inputTypes: ('image' | 'pdf' | 'text' | 'zip' | 'any')[];
  execute: (input: ToolExecutionInput) => Promise<ToolExecutionOutput>;
}

// Helper: load image safely in browser
function loadImageElement(fileOrBlob: Blob | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode image: ${fileOrBlob instanceof File ? fileOrBlob.name : 'image'}`));
    };
    img.src = url;
  });
}

// -------------------------------------------------------------
// CENTRAL TOOL REGISTRY IMPLEMENTATIONS
// -------------------------------------------------------------

export const EXECUTABLE_TOOLS: Record<string, ExecutableTool> = {
  // 1. Image Compressor (Quality or Target Size)
  'image-compressor': {
    id: 'image-compressor',
    name: 'Image Compressor',
    category: 'image',
    description: 'Compresses photos and images to reduce file size while maintaining high visual quality.',
    keywords: ['compress', 'shrink', 'reduce size', 'optimize', 'image', 'photo', 'jpg', 'png', 'webp', 'kb', 'mb'],
    inputTypes: ['image'],
    execute: async ({ files, parameters, onProgress }) => {
      if (files.length === 0) {
        throw new Error('Please upload at least one image to compress.');
      }

      const targetKb = parameters.targetKb ? Number(parameters.targetKb) : null;
      const quality = parameters.quality ? Math.max(0.05, Math.min(1, Number(parameters.quality) / 100)) : 0.75;
      const format = parameters.format || 'image/jpeg';
      const outputFiles: ProcessedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.(Math.round(((i + 0.5) / files.length) * 100), `Compressing ${file.name}...`);

        const img = await loadImageElement(file);
        const canvas = document.createElement('canvas');

        let finalBlob: Blob;

        if (targetKb && targetKb > 0) {
          // Exact target size binary search
          const targetBytes = targetKb * 1024;
          let bestBlob: Blob | null = null;

          // Multi-pass scale down if needed
          for (let scalePass = 0; scalePass < 5; scalePass++) {
            const scale = Math.pow(0.85, scalePass);
            const w = Math.max(50, Math.round(img.naturalWidth * scale));
            const h = Math.max(50, Math.round(img.naturalHeight * scale));
            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas 2D context not available');

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            let lowQ = 0.05;
            let highQ = 0.95;

            for (let iter = 0; iter < 7; iter++) {
              const midQ = (lowQ + highQ) / 2;
              const blob: Blob = await new Promise((res, rej) =>
                canvas.toBlob((b) => (b ? res(b) : rej(new Error('Canvas blob failure'))), 'image/jpeg', midQ)
              );

              if (blob.size <= targetBytes) {
                bestBlob = blob;
                lowQ = midQ;
              } else {
                highQ = midQ;
              }
            }

            if (bestBlob && bestBlob.size <= targetBytes) break;
          }

          if (!bestBlob) {
            // Fallback to lowest possible quality
            canvas.width = Math.round(img.naturalWidth * 0.5);
            canvas.height = Math.round(img.naturalHeight * 0.5);
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            finalBlob = await new Promise((res, rej) =>
              canvas.toBlob((b) => (b ? res(b) : rej(new Error('Canvas blob failure'))), 'image/jpeg', 0.1)
            );
          } else {
            finalBlob = bestBlob;
          }
        } else {
          // Standard quality compression
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D context not available');

          if (format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);

          finalBlob = await new Promise((res, rej) =>
            canvas.toBlob((b) => (b ? res(b) : rej(new Error('Canvas blob failure'))), format, quality)
          );
        }

        const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const outName = `${baseName}_compressed.${ext}`;

        outputFiles.push({
          name: outName,
          blob: finalBlob,
          url: URL.createObjectURL(finalBlob),
          type: finalBlob.type,
          size: finalBlob.size,
          originalSize: file.size,
          width: canvas.width,
          height: canvas.height,
        });
      }

      onProgress?.(100, `Compressed ${outputFiles.length} image(s) successfully`);

      const totalOrig = files.reduce((acc, f) => acc + f.size, 0);
      const totalNew = outputFiles.reduce((acc, f) => acc + f.size, 0);
      const savedPercent = Math.max(0, Math.round(((totalOrig - totalNew) / totalOrig) * 100));

      return {
        success: true,
        message: `Successfully compressed ${outputFiles.length} image(s), reducing total size by ${savedPercent}%.`,
        files: outputFiles,
        stats: { totalOriginalBytes: totalOrig, totalNewBytes: totalNew, savedPercent },
      };
    },
  },

  // 2. Image Resizer
  'image-resizer': {
    id: 'image-resizer',
    name: 'Image Resizer',
    category: 'image',
    description: 'Resizes images to specified pixel dimensions, percentage scale, or photo presets.',
    keywords: ['resize', 'dimensions', 'width', 'height', 'scale', 'passport', 'pixels', 'photo size'],
    inputTypes: ['image'],
    execute: async ({ files, parameters, onProgress }) => {
      if (files.length === 0) throw new Error('Please upload an image to resize.');

      let targetWidth = parameters.width ? Number(parameters.width) : 0;
      let targetHeight = parameters.height ? Number(parameters.height) : 0;
      const preset = parameters.preset || '';

      if (preset === 'passport') {
        // Standard passport size 3.5cm x 4.5cm @ 300 DPI = ~413 x 531 px
        targetWidth = 413;
        targetHeight = 531;
      } else if (preset === 'signature') {
        targetWidth = 300;
        targetHeight = 100;
      } else if (preset === 'square' || preset === 'avatar') {
        targetWidth = 500;
        targetHeight = 500;
      } else if (preset === 'hd') {
        targetWidth = 1920;
        targetHeight = 1080;
      }

      const outputFiles: ProcessedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.(Math.round(((i + 0.5) / files.length) * 100), `Resizing ${file.name}...`);

        const img = await loadImageElement(file);
        let finalW = targetWidth;
        let finalH = targetHeight;

        if (finalW > 0 && finalH === 0) {
          finalH = Math.round(finalW * (img.naturalHeight / img.naturalWidth));
        } else if (finalH > 0 && finalW === 0) {
          finalW = Math.round(finalH * (img.naturalWidth / img.naturalHeight));
        } else if (finalW === 0 && finalH === 0) {
          // Default 50% scale if nothing provided
          finalW = Math.round(img.naturalWidth * 0.5);
          finalH = Math.round(img.naturalHeight * 0.5);
        }

        const canvas = document.createElement('canvas');
        canvas.width = finalW;
        canvas.height = finalH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context unavailable');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, finalW, finalH);

        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob: Blob = await new Promise((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error('Canvas blob failure'))), format, 0.9)
        );

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const outName = `${baseName}_${finalW}x${finalH}.${format === 'image/png' ? 'png' : 'jpg'}`;

        outputFiles.push({
          name: outName,
          blob,
          url: URL.createObjectURL(blob),
          type: blob.type,
          size: blob.size,
          originalSize: file.size,
          width: finalW,
          height: finalH,
        });
      }

      return {
        success: true,
        message: `Resized ${outputFiles.length} image(s) to ${targetWidth || 'scaled'}x${targetHeight || 'scaled'} px.`,
        files: outputFiles,
      };
    },
  },

  // 3. Image Format Converter
  'image-converter': {
    id: 'image-converter',
    name: 'Image Converter',
    category: 'image',
    description: 'Converts images between JPG, PNG, and WebP formats.',
    keywords: ['convert', 'jpg', 'jpeg', 'png', 'webp', 'format', 'turn into jpg', 'make png'],
    inputTypes: ['image'],
    execute: async ({ files, parameters, onProgress }) => {
      if (files.length === 0) throw new Error('Please upload an image to convert.');

      let targetFormat = (parameters.format || 'jpg').toLowerCase();
      let mimeType = 'image/jpeg';
      let extension = 'jpg';

      if (targetFormat.includes('png')) {
        mimeType = 'image/png';
        extension = 'png';
      } else if (targetFormat.includes('webp')) {
        mimeType = 'image/webp';
        extension = 'webp';
      }

      const outputFiles: ProcessedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.(Math.round(((i + 0.5) / files.length) * 100), `Converting ${file.name} to ${extension.toUpperCase()}...`);

        const img = await loadImageElement(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context unavailable');

        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        const blob: Blob = await new Promise((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error('Canvas blob failure'))), mimeType, 0.92)
        );

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const outName = `${baseName}.${extension}`;

        outputFiles.push({
          name: outName,
          blob,
          url: URL.createObjectURL(blob),
          type: blob.type,
          size: blob.size,
          originalSize: file.size,
          width: canvas.width,
          height: canvas.height,
        });
      }

      return {
        success: true,
        message: `Converted ${outputFiles.length} image(s) to ${extension.toUpperCase()} format.`,
        files: outputFiles,
      };
    },
  },

  // 4. Merge PDFs
  'pdf-merge': {
    id: 'pdf-merge',
    name: 'Merge PDFs',
    category: 'pdf',
    description: 'Combines multiple PDF files into one clean, continuous document.',
    keywords: ['merge', 'combine', 'join', 'pdf', 'concatenate', 'unite', 'bind'],
    inputTypes: ['pdf'],
    execute: async ({ files, parameters, onProgress }) => {
      const pdfFiles = files.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      if (pdfFiles.length < 2) {
        throw new Error('Please select at least 2 PDF files to merge.');
      }

      onProgress?.(10, 'Initializing PDF merger...');
      const mergedPdf = await PDFDocument.create();
      let totalPages = 0;

      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        onProgress?.(
          Math.round(15 + ((i + 1) / pdfFiles.length) * 70),
          `Merging "${file.name}" (${i + 1} of ${pdfFiles.length})...`
        );

        const buffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        totalPages += copiedPages.length;
      }

      onProgress?.(90, 'Generating final merged PDF...');
      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const outName = parameters.outputName || 'merged_document.pdf';

      const processed: ProcessedFile = {
        name: outName,
        blob,
        url: URL.createObjectURL(blob),
        type: 'application/pdf',
        size: blob.size,
      };

      return {
        success: true,
        message: `Merged ${pdfFiles.length} PDF files (${totalPages} total pages) into "${outName}".`,
        files: [processed],
        stats: { totalPages, filesMerged: pdfFiles.length },
      };
    },
  },

  // 5. Split / Extract PDF
  'pdf-split': {
    id: 'pdf-split',
    name: 'Split PDF Pages',
    category: 'pdf',
    description: 'Extracts specific pages or splits a PDF document into separate files.',
    keywords: ['split', 'extract', 'pages', 'divide', 'cut pdf', 'remove pages', 'delete pages'],
    inputTypes: ['pdf'],
    execute: async ({ files, parameters, onProgress }) => {
      const pdfFile = files.find((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      if (!pdfFile) throw new Error('Please upload a PDF file to split.');

      onProgress?.(20, 'Reading PDF document...');
      const buffer = await pdfFile.arrayBuffer();
      const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const totalPages = sourceDoc.getPageCount();

      const pageRangeStr = (parameters.pageRange || parameters.pages || '1').toString().trim();
      const targetIndices: number[] = [];

      // Parse page ranges (e.g., "1,3,5" or "2-4" or "2, 4, 6")
      const tokens = pageRangeStr.split(/[, ]+/);
      for (const token of tokens) {
        if (!token) continue;
        if (token.includes('-')) {
          const [startStr, endStr] = token.split('-');
          const start = Math.max(1, parseInt(startStr, 10));
          const end = Math.min(totalPages, parseInt(endStr, 10));
          for (let p = start; p <= end; p++) {
            if (!targetIndices.includes(p - 1)) targetIndices.push(p - 1);
          }
        } else {
          const p = parseInt(token, 10);
          if (!isNaN(p) && p >= 1 && p <= totalPages) {
            if (!targetIndices.includes(p - 1)) targetIndices.push(p - 1);
          }
        }
      }

      if (targetIndices.length === 0) {
        // If no valid range, extract page 1
        targetIndices.push(0);
      }

      onProgress?.(60, `Extracting ${targetIndices.length} page(s)...`);
      const splitDoc = await PDFDocument.create();
      const copied = await splitDoc.copyPages(sourceDoc, targetIndices);
      copied.forEach((p) => splitDoc.addPage(p));

      const splitBytes = await splitDoc.save();
      const blob = new Blob([splitBytes], { type: 'application/pdf' });
      const baseName = pdfFile.name.substring(0, pdfFile.name.lastIndexOf('.')) || pdfFile.name;
      const outName = `${baseName}_extracted_p${targetIndices.map((i) => i + 1).join('-')}.pdf`;

      const processed: ProcessedFile = {
        name: outName,
        blob,
        url: URL.createObjectURL(blob),
        type: 'application/pdf',
        size: blob.size,
      };

      return {
        success: true,
        message: `Extracted pages ${targetIndices.map((i) => i + 1).join(', ')} from "${pdfFile.name}".`,
        files: [processed],
        stats: { extractedPages: targetIndices.length, totalPages },
      };
    },
  },

  // 6. Images to PDF
  'images-to-pdf': {
    id: 'images-to-pdf',
    name: 'Images to PDF',
    category: 'pdf',
    description: 'Combines multiple photos, documents, or scans into a single organized PDF.',
    keywords: ['images to pdf', 'photos to pdf', 'convert', 'jpg to pdf', 'png to pdf', 'make pdf from photos'],
    inputTypes: ['image'],
    execute: async ({ files, parameters, onProgress }) => {
      const imgFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imgFiles.length === 0) throw new Error('Please upload at least one image to convert to PDF.');

      onProgress?.(15, 'Creating PDF document...');
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < imgFiles.length; i++) {
        const file = imgFiles[i];
        onProgress?.(
          Math.round(20 + ((i + 1) / imgFiles.length) * 65),
          `Embedding image ${i + 1} of ${imgFiles.length} (${file.name})...`
        );

        let imageBytes = await file.arrayBuffer();
        let embeddedImage;

        // Ensure JPEG or PNG compatibility
        if (file.type === 'image/png') {
          try {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
          } catch {
            // Fallback: draw to canvas and embed as JPEG
            const img = await loadImageElement(file);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const jpegBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9));
            imageBytes = await jpegBlob.arrayBuffer();
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
          }
        } else {
          try {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
          } catch {
            const img = await loadImageElement(file);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const jpegBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9));
            imageBytes = await jpegBlob.arrayBuffer();
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
          }
        }

        // Standard A4 page: 595.28 x 841.89 points
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        const scale = Math.min((pageWidth - 40) / embeddedImage.width, (pageHeight - 40) / embeddedImage.height);
        const drawW = embeddedImage.width * scale;
        const drawH = embeddedImage.height * scale;
        const x = (pageWidth - drawW) / 2;
        const y = (pageHeight - drawH) / 2;

        page.drawImage(embeddedImage, { x, y, width: drawW, height: drawH });
      }

      onProgress?.(90, 'Finalizing PDF...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const outName = parameters.outputName || 'images_document.pdf';

      const processed: ProcessedFile = {
        name: outName,
        blob,
        url: URL.createObjectURL(blob),
        type: 'application/pdf',
        size: blob.size,
      };

      return {
        success: true,
        message: `Converted ${imgFiles.length} image(s) into a ${imgFiles.length}-page PDF document.`,
        files: [processed],
        stats: { pageCount: imgFiles.length },
      };
    },
  },

  // 7. Add Page Numbers to PDF
  'pdf-page-numbers': {
    id: 'pdf-page-numbers',
    name: 'Add Page Numbers to PDF',
    category: 'pdf',
    description: 'Numbers every page of a PDF document at the bottom center or right.',
    keywords: ['page numbers', 'add page numbers', 'number pdf', 'paginate pdf', 'footer numbers'],
    inputTypes: ['pdf'],
    execute: async ({ files, parameters, onProgress }) => {
      const pdfFile = files.find((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      if (!pdfFile) throw new Error('Please upload a PDF file.');

      onProgress?.(20, 'Loading PDF for pagination...');
      const buffer = await pdfFile.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const totalPages = doc.getPageCount();

      for (let i = 0; i < totalPages; i++) {
        onProgress?.(Math.round(20 + ((i + 1) / totalPages) * 70), `Numbering page ${i + 1} of ${totalPages}...`);
        const page = doc.getPage(i);
        const { width } = page.getSize();
        const text = `Page ${i + 1} of ${totalPages}`;
        const fontSize = 10;
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: 20,
          size: fontSize,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      }

      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const baseName = pdfFile.name.substring(0, pdfFile.name.lastIndexOf('.')) || pdfFile.name;
      const outName = `${baseName}_numbered.pdf`;

      const processed: ProcessedFile = {
        name: outName,
        blob,
        url: URL.createObjectURL(blob),
        type: 'application/pdf',
        size: blob.size,
      };

      return {
        success: true,
        message: `Added page numbers to all ${totalPages} pages of "${pdfFile.name}".`,
        files: [processed],
      };
    },
  },

  // 8. ZIP File Creator
  'file-zip-create': {
    id: 'file-zip-create',
    name: 'ZIP Archive Creator',
    category: 'media',
    description: 'Compresses and bundles multiple files into a single downloadable .zip archive.',
    keywords: ['zip', 'archive', 'compress to zip', 'bundle', 'put in zip', 'create zip', 'tar'],
    inputTypes: ['any'],
    execute: async ({ files, parameters, onProgress }) => {
      if (files.length === 0) throw new Error('Please upload at least one file to create a ZIP archive.');

      onProgress?.(20, `Preparing ${files.length} file(s) for ZIP archiving...`);
      const zipData: Record<string, Uint8Array> = {};

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.(
          Math.round(20 + ((i + 1) / files.length) * 60),
          `Packing ${file.name} (${i + 1} of ${files.length})...`
        );
        const buf = await file.arrayBuffer();
        zipData[file.name] = new Uint8Array(buf);
      }

      onProgress?.(85, 'Compressing archive...');
      const zipBlob: Blob = await new Promise((resolve, reject) => {
        zip(zipData, { level: 6 }, (err, out) => {
          if (err) reject(new Error(`ZIP creation failed: ${err.message}`));
          else resolve(new Blob([out.buffer as ArrayBuffer], { type: 'application/zip' }));
        });
      });

      const archiveName = parameters.zipName || parameters.archiveName || 'toolhub_processed_archive.zip';
      const processed: ProcessedFile = {
        name: archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`,
        blob: zipBlob,
        url: URL.createObjectURL(zipBlob),
        type: 'application/zip',
        size: zipBlob.size,
      };

      return {
        success: true,
        message: `Created ZIP archive containing ${files.length} file(s) (${(zipBlob.size / 1024).toFixed(1)} KB).`,
        files: [processed],
        stats: { archivedFilesCount: files.length, totalArchiveBytes: zipBlob.size },
      };
    },
  },

  // 9. Word & Text Counter
  'word-counter': {
    id: 'word-counter',
    name: 'Word & Text Counter',
    category: 'text',
    description: 'Analyzes text for word count, character count, sentence count, and reading time.',
    keywords: ['word counter', 'count words', 'character counter', 'reading time', 'text statistics'],
    inputTypes: ['text', 'any'],
    execute: async ({ files, text: rawText }) => {
      let content = rawText || '';
      if (!content && files.length > 0) {
        content = await files[0].text();
      }

      if (!content.trim()) throw new Error('Please provide text or upload a text document to analyze.');

      const trimmed = content.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      const charactersWithSpaces = content.length;
      const charactersNoSpaces = content.replace(/\s/g, '').length;
      const sentences = trimmed ? (content.match(/[^.!?]+[.!?]+(\s|$)/g) || []).length || (words > 0 ? 1 : 0) : 0;
      const paragraphs = trimmed ? content.split(/\n+/).filter((p) => p.trim().length > 0).length : 0;
      const readingTimeMinutes = Math.ceil(words / 200);

      const stats = {
        words,
        charactersWithSpaces,
        charactersNoSpaces,
        sentences,
        paragraphs,
        readingTimeMinutes,
      };

      const summaryText = `Text Analysis:\n- Words: ${words}\n- Characters (with spaces): ${charactersWithSpaces}\n- Characters (without spaces): ${charactersNoSpaces}\n- Sentences: ${sentences}\n- Paragraphs: ${paragraphs}\n- Estimated Reading Time: ~${readingTimeMinutes} min`;

      return {
        success: true,
        message: `Analysis completed: ${words} words, ${charactersWithSpaces} characters, ~${readingTimeMinutes} min reading time.`,
        files: [],
        text: summaryText,
        data: stats,
      };
    },
  },

  // 10. Text Case & Formatting Cleaner
  'text-cleaner': {
    id: 'text-cleaner',
    name: 'Text Cleaner & Case Converter',
    category: 'text',
    description: 'Converts text case (UPPERCASE, lowercase, Title Case) and strips extra spaces or duplicate lines.',
    keywords: ['uppercase', 'lowercase', 'title case', 'clean text', 'remove spaces', 'remove duplicate lines'],
    inputTypes: ['text', 'any'],
    execute: async ({ files, text: rawText, parameters }) => {
      let content = rawText || '';
      if (!content && files.length > 0) {
        content = await files[0].text();
      }

      if (!content) throw new Error('Please enter text or upload a file.');

      const action = parameters.action || 'clean';
      let result = content;

      if (action === 'uppercase' || parameters.uppercase) {
        result = result.toUpperCase();
      } else if (action === 'lowercase' || parameters.lowercase) {
        result = result.toLowerCase();
      } else if (action === 'titlecase' || parameters.titlecase) {
        result = result.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
      }

      if (parameters.removeExtraSpaces || action === 'remove-extra-spaces' || action === 'clean') {
        result = result.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
      }

      if (parameters.removeDuplicateLines || action === 'remove-duplicate-lines') {
        const lines = result.split('\n');
        const seen = new Set<string>();
        const uniqueLines: string[] = [];
        for (const line of lines) {
          if (!seen.has(line)) {
            seen.add(line);
            uniqueLines.push(line);
          }
        }
        result = uniqueLines.join('\n');
      }

      const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
      const processed: ProcessedFile = {
        name: 'cleaned_text.txt',
        blob,
        url: URL.createObjectURL(blob),
        type: 'text/plain',
        size: blob.size,
      };

      return {
        success: true,
        message: 'Text processed and cleaned successfully.',
        files: [processed],
        text: result,
      };
    },
  },

  // 11. JSON Formatter & Validator
  'dev-json-formatter': {
    id: 'dev-json-formatter',
    name: 'JSON Formatter & Validator',
    category: 'developer',
    description: 'Beautifies, minifies, and validates JSON syntax with clear error messages.',
    keywords: ['json', 'format json', 'prettify json', 'minify json', 'validate json', 'beautify json'],
    inputTypes: ['text', 'any'],
    execute: async ({ files, text: rawText, parameters }) => {
      let content = rawText || '';
      if (!content && files.length > 0) {
        content = await files[0].text();
      }

      if (!content.trim()) throw new Error('Please provide JSON text or upload a .json file.');

      try {
        const parsed = JSON.parse(content);
        const indent = parameters.minify ? 0 : parameters.indent || 2;
        const formatted = parameters.minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);

        const blob = new Blob([formatted], { type: 'application/json;charset=utf-8' });
        const processed: ProcessedFile = {
          name: parameters.minify ? 'minified.json' : 'formatted.json',
          blob,
          url: URL.createObjectURL(blob),
          type: 'application/json',
          size: blob.size,
        };

        return {
          success: true,
          message: `Valid JSON ${parameters.minify ? 'minified' : 'formatted'} successfully (${formatted.length} characters).`,
          files: [processed],
          text: formatted,
          data: parsed,
        };
      } catch (err: any) {
        throw new Error(`Invalid JSON syntax: ${err.message}`);
      }
    },
  },

  // 12. QR Code Generator
  'qr-generator': {
    id: 'qr-generator',
    name: 'QR Code Generator',
    category: 'qr',
    description: 'Generates high-resolution, downloadable QR code images from any text or link.',
    keywords: ['qr code', 'generate qr', 'make qr', 'barcode qr', 'link to qr'],
    inputTypes: ['text', 'any'],
    execute: async ({ text: rawText, parameters }) => {
      const content = rawText || parameters.content || parameters.url || 'https://toolhub.app';
      if (!content.trim()) throw new Error('Please specify text or a URL for the QR code.');

      const dataUrl = await QRCode.toDataURL(content, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 600,
        color: {
          dark: parameters.darkColor || '#000000',
          light: parameters.lightColor || '#FFFFFF',
        },
      });

      // Convert data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const processed: ProcessedFile = {
        name: 'qrcode.png',
        blob,
        url: URL.createObjectURL(blob),
        type: 'image/png',
        size: blob.size,
        width: 600,
        height: 600,
      };

      return {
        success: true,
        message: `Generated QR code for "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}".`,
        files: [processed],
        text: content,
      };
    },
  },
};
