import { describe, it, expect } from 'vitest';
import { generateSecurePassword, generateUUID } from '../utils/crypto';

describe('Cryptography Utilities', () => {
  it('generates secure passwords with exact requested length', () => {
    const pw16 = generateSecurePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
    expect(pw16.length).toBe(16);

    const pw32 = generateSecurePassword({
      length: 32,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
    });
    expect(pw32.length).toBe(32);
    // Should not contain symbols
    expect(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(pw32)).toBe(false);
  });

  it('generates valid RFC 4122 v4 UUID format', () => {
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(uuid)).toBe(true);
  });
});
