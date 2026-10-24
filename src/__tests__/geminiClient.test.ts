import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeModelId,
  getAllAvailableModels,
  AVAILABLE_GEMINI_MODELS,
  getUserApiKey,
  saveUserApiKey,
  removeUserApiKey,
  hasUserApiKey,
  getEffectiveApiKey,
  getPreferredModel,
  savePreferredModel,
  DEFAULT_GEMINI_MODEL,
} from '../services/ai/geminiClient';

describe('Gemini AI Client & Multi-Model Engine', () => {
  const storageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });
    localStorage.clear();
  });

  describe('normalizeModelId', () => {
    it('normalizes Argon model aliases to gemini-4-argon', () => {
      expect(normalizeModelId('argon')).toBe('gemini-4-argon');
      expect(normalizeModelId('gemini-argon')).toBe('gemini-4-argon');
      expect(normalizeModelId('4-argon')).toBe('gemini-4-argon');
      expect(normalizeModelId('gemini-4-argon')).toBe('gemini-4-argon');
      expect(normalizeModelId('models/gemini-4-argon')).toBe('gemini-4-argon');
    });

    it('normalizes 3.8 model aliases to gemini-3.8-flash', () => {
      expect(normalizeModelId('3.8')).toBe('gemini-3.8-flash');
      expect(normalizeModelId('gemini-3.8')).toBe('gemini-3.8-flash');
      expect(normalizeModelId('3.8-flash')).toBe('gemini-3.8-flash');
      expect(normalizeModelId('gemini-3.8-flash')).toBe('gemini-3.8-flash');
      expect(normalizeModelId('models/gemini-3.8-flash')).toBe('gemini-3.8-flash');
    });

    it('normalizes other Gemini generations and aliases', () => {
      expect(normalizeModelId('3.7')).toBe('gemini-3.7-flash');
      expect(normalizeModelId('3.1')).toBe('gemini-3.1-pro-preview');
      expect(normalizeModelId('2.5')).toBe('gemini-2.5-flash');
      expect(normalizeModelId('flash')).toBe('gemini-2.5-flash');
      expect(normalizeModelId('pro')).toBe('gemini-2.5-pro');
      expect(normalizeModelId('models/custom-model')).toBe('custom-model');
    });
  });

  describe('Model Catalog & Availability', () => {
    it('includes flagship argon and 3.8 in curated models', () => {
      const models = getAllAvailableModels();
      const ids = models.map((m) => m.id);

      expect(ids).toContain('gemini-4-argon');
      expect(ids).toContain('gemini-3.8-flash');
      expect(ids).toContain('gemini-2.5-flash');
      expect(ids).toContain('gemini-2.5-pro');
    });

    it('falls back to DEFAULT_GEMINI_MODEL when none saved', () => {
      expect(getPreferredModel()).toBe(DEFAULT_GEMINI_MODEL);
    });

    it('persists preferred model selection with normalization', () => {
      savePreferredModel('argon');
      expect(getPreferredModel()).toBe('gemini-4-argon');

      savePreferredModel('3.8');
      expect(getPreferredModel()).toBe('gemini-3.8-flash');

      savePreferredModel('gemini-2.5-pro');
      expect(getPreferredModel()).toBe('gemini-2.5-pro');
    });
  });

  describe('User API Key Management', () => {
    it('saves, retrieves, and removes user API key safely', () => {
      expect(hasUserApiKey()).toBe(false);
      expect(getUserApiKey()).toBe('');

      saveUserApiKey('AIzaSyTestKey12345');
      expect(hasUserApiKey()).toBe(true);
      expect(getUserApiKey()).toBe('AIzaSyTestKey12345');
      expect(getEffectiveApiKey()).toBe('AIzaSyTestKey12345');

      removeUserApiKey();
      expect(hasUserApiKey()).toBe(false);
      expect(getUserApiKey()).toBe('');
    });
  });
});
