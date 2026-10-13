import { describe, it, expect } from 'vitest';
import { TOOLS, TOOL_MAP } from '../config/tools';
import { CATEGORIES } from '../config/categories';
import { searchTools } from '../services/search/searchService';

describe('Tool Registry & Search Service', () => {
  it('contains over 100 tools across all 11 categories', () => {
    expect(TOOLS.length).toBeGreaterThan(120);

    const categoriesInRegistry = new Set(TOOLS.map((t) => t.category));
    const allExpectedCategories = Object.keys(CATEGORIES);

    allExpectedCategories.forEach((cat) => {
      expect(categoriesInRegistry.has(cat as any)).toBe(true);
    });
  });

  it('guarantees unique tool IDs', () => {
    const idSet = new Set<string>();
    TOOLS.forEach((tool) => {
      expect(idSet.has(tool.id)).toBe(false);
      idSet.add(tool.id);
    });
    expect(TOOL_MAP.size).toBe(TOOLS.length);
  });

  it('finds exact and partial matches through fuzzy search', () => {
    const compressResults = searchTools('compress');
    expect(compressResults.length).toBeGreaterThan(0);
    expect(compressResults.some((t) => t.id === 'image-compressor')).toBe(true);

    const pdfResults = searchTools('pdf merge');
    expect(pdfResults.some((t) => t.id === 'pdf-merge')).toBe(true);

    const gpaResults = searchTools('sgpa');
    expect(gpaResults.some((t) => t.id === 'sgpa-calculator')).toBe(true);
  });
});
