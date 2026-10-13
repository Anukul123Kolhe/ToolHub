import { describe, it, expect } from 'vitest';
import DiffMatchPatch from 'diff-match-patch';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';

describe('Advanced Utility Functions', () => {
  it('correctly calculates GST for exclusive and inclusive rates', () => {
    // Exclusive 18% on 1000
    const net = 1000;
    const rate = 18;
    const gstExclusive = (net * rate) / 100;
    const grossExclusive = net + gstExclusive;

    expect(gstExclusive).toBe(180);
    expect(grossExclusive).toBe(1180);

    // Inclusive 18% on 1180
    const grossInclusive = 1180;
    const calculatedNet = (grossInclusive * 100) / (100 + rate);
    const calculatedGst = grossInclusive - calculatedNet;

    expect(Math.round(calculatedNet)).toBe(1000);
    expect(Math.round(calculatedGst)).toBe(180);
  });

  it('computes accurate chronological age and next birthday', () => {
    const dob = new Date('2000-01-01');
    const target = new Date('2025-01-01');

    let years = target.getFullYear() - dob.getFullYear();
    let months = target.getMonth() - dob.getMonth();
    let days = target.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    expect(years).toBe(25);
    expect(months).toBe(0);
    expect(days).toBe(0);
  });

  it('performs text diff matching and identifies additions/deletions', () => {
    const dmp = new DiffMatchPatch();
    const text1 = 'Hello World';
    const text2 = 'Hello Brave New World';

    const diffs = dmp.diff_main(text1, text2);
    dmp.diff_cleanupSemantic(diffs);

    const hasAddition = diffs.some(([op, text]) => op === 1 && text.includes('Brave New'));
    expect(hasAddition).toBe(true);
  });

  it('creates and extracts ZIP archives in memory with fflate', () => {
    const originalContent = 'ToolHub in-browser privacy-first test file';
    const originalFileName = 'hello.txt';

    const zipped = zipSync({
      [originalFileName]: strToU8(originalContent),
    });

    expect(zipped.length).toBeGreaterThan(0);

    const unzipped = unzipSync(zipped);
    expect(unzipped[originalFileName]).toBeDefined();
    expect(strFromU8(unzipped[originalFileName])).toBe(originalContent);
  });

  it('correctly resolves category list queries with complete multi-tool listings', async () => {
    const { resolveNaturalLanguageIntent } = await import('../services/ai/aiService');

    // 1. Image tools list test
    const imageListRes = resolveNaturalLanguageIntent('Give me list of image tools');
    expect(imageListRes.message).toContain('/tool/image-compressor');
    expect(imageListRes.message).toContain('/tool/image-exact-size');
    expect(imageListRes.message).toContain('/tool/image-resizer');
    expect(imageListRes.message).toContain('/tool/image-cropper');
    expect(imageListRes.message).not.toContain('I identified that **Image Compressor** is the best match');

    // 2. PDF tools list test
    const pdfListRes = resolveNaturalLanguageIntent('Show me PDF tools');
    expect(pdfListRes.message).toContain('/tool/pdf-merge');
    expect(pdfListRes.message).toContain('/tool/pdf-split');
    expect(pdfListRes.message).toContain('/tool/pdf-compress');

    // 3. Student tools list test
    const studentListRes = resolveNaturalLanguageIntent('What student tools are available?');
    expect(studentListRes.message).toContain('/tool/sgpa-calculator');
    expect(studentListRes.message).toContain('/tool/attendance-calculator');

    // 4. All tools overview test
    const allToolsRes = resolveNaturalLanguageIntent('List all tools');
    expect(allToolsRes.message).toContain('PDF & Documents');
    expect(allToolsRes.message).toContain('Image & Photos');
    expect(allToolsRes.message).toContain('Students & Academics');

    // 5. Targeted task execution plan test
    const targetKbRes = resolveNaturalLanguageIntent('Compress this photo to less than 100 KB');
    expect(targetKbRes.actionPlan).toBeDefined();
    expect(targetKbRes.actionPlan?.tool.id).toBe('image-exact-size');
    expect(targetKbRes.actionPlan?.parameters.targetKb).toBe(100);
  });
});

