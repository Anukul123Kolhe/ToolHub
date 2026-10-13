import React from 'react';
import { ToolRegistryItem } from '../types/tool';
import { ImageCompressorTool } from './image/ImageCompressorTool';
import { ImageExactSizeTool } from './image/ImageExactSizeTool';
import { PdfMergeTool } from './pdf/PdfMergeTool';
import { SgpaCalculatorTool } from './student/SgpaCalculatorTool';
import { JsonFormatterTool } from './developer/JsonFormatterTool';
import { QrGeneratorTool } from './qr/QrGeneratorTool';
import { PasswordGeneratorTool } from './qr/PasswordGeneratorTool';
import { EmiCalculatorTool } from './calculator/EmiCalculatorTool';
import { AttendanceCalculatorTool } from './student/AttendanceCalculatorTool';
import { WordCounterTool } from './text/WordCounterTool';
import { GenericToolWorkspace } from './GenericToolWorkspace';

interface ToolDispatcherProps {
  tool: ToolRegistryItem;
}

export const ToolDispatcher: React.FC<ToolDispatcherProps> = ({ tool }) => {
  switch (tool.id) {
    case 'image-compressor':
      return <ImageCompressorTool />;
    case 'image-exact-size':
    case 'application-image-compressor':
      return <ImageExactSizeTool />;
    case 'pdf-merge':
    case 'assignment-pdf-merger':
      return <PdfMergeTool />;
    case 'sgpa-calculator':
    case 'cgpa-calculator':
      return <SgpaCalculatorTool />;
    case 'attendance-calculator':
      return <AttendanceCalculatorTool />;
    case 'dev-json-formatter':
    case 'dev-json-validator':
      return <JsonFormatterTool />;
    case 'qr-generator':
    case 'qr-wifi':
    case 'qr-vcard':
      return <QrGeneratorTool />;
    case 'password-generator':
      return <PasswordGeneratorTool />;
    case 'calc-emi':
      return <EmiCalculatorTool />;
    case 'word-counter':
    case 'student-word-counter':
    case 'character-counter':
    case 'case-uppercase':
    case 'case-lowercase':
    case 'case-title':
    case 'case-sentence':
      return <WordCounterTool />;
    default:
      return <GenericToolWorkspace tool={tool} />;
  }
};
