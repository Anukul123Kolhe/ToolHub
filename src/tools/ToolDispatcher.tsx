import React from 'react';
import { ToolRegistryItem } from '../types/tool';
import { ImageCompressorTool } from './image/ImageCompressorTool';
import { ImageExactSizeTool } from './image/ImageExactSizeTool';
import { ImageResizerTool } from './image/ImageResizerTool';
import { PdfMergeTool } from './pdf/PdfMergeTool';
import { PdfSplitTool } from './pdf/PdfSplitTool';
import { ImagesToPdfTool } from './pdf/ImagesToPdfTool';
import { SgpaCalculatorTool } from './student/SgpaCalculatorTool';
import { JsonFormatterTool } from './developer/JsonFormatterTool';
import { Base64Tool } from './developer/Base64Tool';
import { ChecksumCalculatorTool } from './developer/ChecksumCalculatorTool';
import { QrGeneratorTool } from './qr/QrGeneratorTool';
import { PasswordGeneratorTool } from './qr/PasswordGeneratorTool';
import { BarcodeGeneratorTool } from './qr/BarcodeGeneratorTool';
import { EmiCalculatorTool } from './calculator/EmiCalculatorTool';
import { AgeCalculatorTool } from './calculator/AgeCalculatorTool';
import { GstCalculatorTool } from './calculator/GstCalculatorTool';
import { AttendanceCalculatorTool } from './student/AttendanceCalculatorTool';
import { WordCounterTool } from './text/WordCounterTool';
import { TextDiffTool } from './text/TextDiffTool';
import { ZipTool } from './media/ZipTool';
import { GenericToolWorkspace } from './GenericToolWorkspace';

interface ToolDispatcherProps {
  tool: ToolRegistryItem;
}

export const ToolDispatcher: React.FC<ToolDispatcherProps> = ({ tool }) => {
  switch (tool.id) {
    case 'image-compressor':
    case 'img-compress-image':
    case 'img-reduce-image-file-size':
    case 'img-optimize-images-for-web-use':
    case 'img-compress-multiple-images':
      return <ImageCompressorTool />;
    case 'image-exact-size':
    case 'application-image-compressor':
    case 'img-compress-image-to-an-exact-kb-target':
    case 'img-compress-exact-kb':
    case 'img-compress-image-to-an-mb-target':
    case 'img-resize-photos-to-exact-file-size-limits':
      return <ImageExactSizeTool />;
    case 'image-resizer':
    case 'signature-resizer':
    case 'img-resize-image-by-pixels':
    case 'img-resize-by-pixels':
    case 'img-resize-image-by-percentage':
    case 'img-resize-image-by-centimetres-millimetres-or-inches':
    case 'img-signature-resizing-to-exact-dimensions':
    case 'img-passport-and-id-photo-resizer':
    case 'img-pan-card-photo-resizing':
    case 'img-convert-image-to-specific-pixel-dimensions':
    case 'img-resize-multiple-images':
      return <ImageResizerTool />;
    case 'pdf-merge':
    case 'assignment-pdf-merger':
    case 'pdf-merge-pdf':
    case 'pdf-assemble-pdf':
      return <PdfMergeTool />;
    case 'pdf-split':
    case 'pdf-extract-pages':
    case 'pdf-split-pdf':
    case 'pdf-remove-pdf-pages':
    case 'pdf-delete-pages':
      return <PdfSplitTool />;
    case 'images-to-pdf':
    case 'photo-to-pdf':
    case 'pdf-jpg-to-pdf':
    case 'pdf-png-to-pdf':
    case 'pdf-webp-to-pdf':
    case 'pdf-images-to-pdf':
    case 'pdf-image-to-pdf-converter':
      return <ImagesToPdfTool />;
    case 'sgpa-calculator':
    case 'cgpa-calculator':
      return <SgpaCalculatorTool />;
    case 'attendance-calculator':
      return <AttendanceCalculatorTool />;
    case 'dev-json-formatter':
    case 'dev-json-validator':
      return <JsonFormatterTool />;
    case 'dev-base64-encode':
    case 'dev-base64-decode':
      return <Base64Tool />;
    case 'dev-checksum-calculator':
    case 'adv-file-hasher':
      return <ChecksumCalculatorTool />;
    case 'text-diff-viewer':
    case 'dev-code-diff':
      return <TextDiffTool />;
    case 'barcode-generator':
      return <BarcodeGeneratorTool />;
    case 'file-zip-create':
    case 'file-zip-extract':
      return <ZipTool />;
    case 'qr-generator':
    case 'qr-wifi':
    case 'qr-vcard':
    case 'pdf-generate-qr-code':
      return <QrGeneratorTool />;
    case 'password-generator':
    case 'pdf-generate-password':
    case 'prod-password-generator':
      return <PasswordGeneratorTool />;
    case 'calc-emi':
    case 'calc-mortgage-calculator':
      return <EmiCalculatorTool />;
    case 'calc-age':
    case 'calc-birthday-calculator':
      return <AgeCalculatorTool />;
    case 'calc-gst':
    case 'calc-discount-calculator':
      return <GstCalculatorTool />;
    case 'word-counter':
    case 'student-word-counter':
    case 'character-counter':
    case 'case-uppercase':
    case 'case-lowercase':
    case 'case-title':
    case 'case-sentence':
    case 'text-online-text-editor':
      return <WordCounterTool />;
    default:
      return <GenericToolWorkspace tool={tool} />;
  }
};

