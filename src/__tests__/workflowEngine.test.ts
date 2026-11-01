import { describe, it, expect } from 'vitest';
import { parseWorkflowInstruction } from '../services/ai/workflowEngine';
import { EXECUTABLE_TOOLS } from '../services/ai/toolRegistry';

describe('AI Task Understanding & Workflow Engine', () => {
  it('has all core executable tools registered in the central registry', () => {
    expect(EXECUTABLE_TOOLS['image-compressor']).toBeDefined();
    expect(EXECUTABLE_TOOLS['image-resizer']).toBeDefined();
    expect(EXECUTABLE_TOOLS['image-converter']).toBeDefined();
    expect(EXECUTABLE_TOOLS['pdf-merge']).toBeDefined();
    expect(EXECUTABLE_TOOLS['pdf-split']).toBeDefined();
    expect(EXECUTABLE_TOOLS['images-to-pdf']).toBeDefined();
    expect(EXECUTABLE_TOOLS['pdf-page-numbers']).toBeDefined();
    expect(EXECUTABLE_TOOLS['file-zip-create']).toBeDefined();
    expect(EXECUTABLE_TOOLS['word-counter']).toBeDefined();
    expect(EXECUTABLE_TOOLS['text-cleaner']).toBeDefined();
    expect(EXECUTABLE_TOOLS['dev-json-formatter']).toBeDefined();
    expect(EXECUTABLE_TOOLS['qr-generator']).toBeDefined();
  });

  it('correctly parses multi-step image pipeline: compress + convert + zip', () => {
    const dummyImage = new File(['dummy'], 'photo.png', { type: 'image/png' });
    const prompt = 'Compress these images below 100 KB, convert them into JPG format, and put all the processed images into one ZIP file.';

    const plan = parseWorkflowInstruction(prompt, [dummyImage]);

    expect(plan.needsClarification).toBe(false);
    expect(plan.steps.length).toBe(3);

    // Step 1: Format convert to JPG
    expect(plan.steps[0].toolId).toBe('image-converter');
    expect(plan.steps[0].parameters.format).toBe('jpg');

    // Step 2: Compress below 100 KB
    expect(plan.steps[1].toolId).toBe('image-compressor');
    expect(plan.steps[1].parameters.targetKb).toBe(100);

    // Step 3: Put into ZIP
    expect(plan.steps[2].toolId).toBe('file-zip-create');
  });

  it('triggers clarification question when compression request lacks target size', () => {
    const dummyImage = new File(['dummy'], 'photo.png', { type: 'image/png' });
    const prompt = 'Compress this image';

    const plan = parseWorkflowInstruction(prompt, [dummyImage]);

    expect(plan.needsClarification).toBe(true);
    expect(plan.clarificationQuestion).toBeDefined();
    expect(plan.clarificationOptions?.length).toBeGreaterThan(2);
    expect(plan.clarificationOptions?.some((o) => o.value === '100kb')).toBe(true);
  });

  it('parses PDF merge and page numbering request', () => {
    const pdf1 = new File(['%PDF-1.4 dummy'], 'doc1.pdf', { type: 'application/pdf' });
    const pdf2 = new File(['%PDF-1.4 dummy'], 'doc2.pdf', { type: 'application/pdf' });
    const prompt = 'Take these two PDFs, merge them into one document, and add page numbers';

    const plan = parseWorkflowInstruction(prompt, [pdf1, pdf2]);

    expect(plan.needsClarification).toBe(false);
    expect(plan.steps.length).toBe(2);
    expect(plan.steps[0].toolId).toBe('pdf-merge');
    expect(plan.steps[1].toolId).toBe('pdf-page-numbers');
  });

  it('parses images to PDF request', () => {
    const img1 = new File(['dummy'], 'scan1.jpg', { type: 'image/jpeg' });
    const img2 = new File(['dummy'], 'scan2.jpg', { type: 'image/jpeg' });
    const prompt = 'Convert these photos into a clean PDF';

    const plan = parseWorkflowInstruction(prompt, [img1, img2]);

    expect(plan.needsClarification).toBe(false);
    expect(plan.steps.length).toBe(1);
    expect(plan.steps[0].toolId).toBe('images-to-pdf');
  });

  it('parses passport size photo resizing', () => {
    const img = new File(['dummy'], 'portrait.jpg', { type: 'image/jpeg' });
    const prompt = 'Resize this image to official passport photo dimensions';

    const plan = parseWorkflowInstruction(prompt, [img]);

    expect(plan.needsClarification).toBe(false);
    expect(plan.steps.length).toBe(1);
    expect(plan.steps[0].toolId).toBe('image-resizer');
    expect(plan.steps[0].parameters.preset).toBe('passport');
  });

  it('parses PDF page extraction request', () => {
    const pdf = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
    const prompt = 'Extract pages 2, 4, and 6 from this PDF';

    const plan = parseWorkflowInstruction(prompt, [pdf]);

    expect(plan.needsClarification).toBe(false);
    expect(plan.steps.length).toBe(1);
    expect(plan.steps[0].toolId).toBe('pdf-split');
    expect(plan.steps[0].parameters.pageRange).toContain('2');
  });
});
