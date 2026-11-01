import { describe, it, expect } from 'vitest';
import { parseWorkflowInstruction } from '../services/ai/workflowEngine';

describe('AI File Transformation Architecture & Workflow Integration', () => {
  it('correctly maps single and multi-file inputs to execution plans', () => {
    const file1 = new File(['dummy1'], 'photo1.png', { type: 'image/png' });
    const file2 = new File(['dummy2'], 'photo2.png', { type: 'image/png' });
    const prompt = 'Convert these images into a clean PDF';

    const plan = parseWorkflowInstruction(prompt, [file1, file2]);

    expect(plan.steps.length).toBe(1);
    expect(plan.steps[0].toolId).toBe('images-to-pdf');
    expect(plan.steps[0].phaseName).toBeDefined();
    expect(plan.steps[0].engineName).toBeDefined();
    expect(plan.steps[0].subOperations?.length).toBeGreaterThanOrEqual(2);
  });

  it('correctly sets up multi-operation pipeline for compression and archiving', () => {
    const file = new File(['sample image content'], 'scan.jpg', { type: 'image/jpeg' });
    const prompt = 'Compress this image below 100 KB and put it in a zip file';

    const plan = parseWorkflowInstruction(prompt, [file]);

    expect(plan.steps.length).toBe(2);
    expect(plan.steps[0].toolId).toBe('image-compressor');
    expect(plan.steps[1].toolId).toBe('file-zip-create');
  });

  it('detects missing target size and flags for clarification', () => {
    const file = new File(['image bytes'], 'picture.png', { type: 'image/png' });
    const prompt = 'Compress this picture';

    const plan = parseWorkflowInstruction(prompt, [file]);

    expect(plan.needsClarification).toBe(true);
    expect(plan.clarificationQuestion).toContain('file size');
  });

  it('handles PDF split and page numbering workflow', () => {
    const pdf = new File(['%PDF-1.4 dummy'], 'contract.pdf', { type: 'application/pdf' });
    const prompt = 'Extract pages 1-3 from this PDF and add page numbers';

    const plan = parseWorkflowInstruction(prompt, [pdf]);

    expect(plan.steps.length).toBe(2);
    expect(plan.steps[0].toolId).toBe('pdf-split');
    expect(plan.steps[1].toolId).toBe('pdf-page-numbers');
  });
});
