import Fuse, { type IFuseOptions } from 'fuse.js';
import { TOOLS } from '../../config/tools';
import { ToolCategory, ToolRegistryItem } from '../../types/tool';

const fuseOptions: IFuseOptions<ToolRegistryItem> = {
  keys: [
    { name: 'name', weight: 0.35 },
    { name: 'id', weight: 0.25 },
    { name: 'synonyms', weight: 0.25 },
    { name: 'keywords', weight: 0.20 },
    { name: 'description', weight: 0.10 },
    { name: 'shortDescription', weight: 0.10 },
  ],
  threshold: 0.45,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

const fuse = new Fuse(TOOLS, fuseOptions);

export interface SearchFilterOptions {
  category?: ToolCategory | 'all';
  offlineOnly?: boolean;
}

export function searchTools(query: string, options?: SearchFilterOptions): ToolRegistryItem[] {
  const trimmed = query.trim().toLowerCase();

  let results: ToolRegistryItem[] = [];

  if (!trimmed) {
    results = [...TOOLS];
  } else {
    // 1. Direct word inclusion check (Exact token match)
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    const directMatches = TOOLS.filter((tool) => {
      const toolText = `${tool.name} ${tool.id} ${tool.category} ${tool.synonyms.join(' ')} ${tool.keywords.join(' ')}`.toLowerCase();
      return tokens.every((token) => toolText.includes(token));
    });

    // 2. Fuzzy matches from Fuse.js
    const fuseMatches = fuse.search(trimmed).map((r) => r.item);

    // Merge and deduplicate, prioritizing direct matches
    const seen = new Set<string>();
    for (const item of [...directMatches, ...fuseMatches]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        results.push(item);
      }
    }
  }

  if (options?.category && options.category !== 'all') {
    results = results.filter((tool) => tool.category === options.category);
  }

  if (options?.offlineOnly) {
    results = results.filter((tool) => tool.isOfflineCapable);
  }

  return results;
}

export function getPopularTools(): ToolRegistryItem[] {
  const popularIds = [
    'image-compressor',
    'image-exact-size',
    'pdf-merge',
    'sgpa-calculator',
    'attendance-calculator',
    'dev-json-formatter',
    'qr-generator',
    'password-generator',
    'calc-age',
    'calc-emi',
    'career-resume-builder',
    'adv-ocr-image',
  ];

  return popularIds
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is ToolRegistryItem => t !== undefined);
}
