export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous?: boolean;
}

export function generateSecurePassword(options: PasswordOptions): string {
  let uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowercase = 'abcdefghijklmnopqrstuvwxyz';
  let numbers = '0123456789';
  let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (options.excludeAmbiguous) {
    uppercase = uppercase.replace(/[IO]/g, '');
    lowercase = lowercase.replace(/[l|o]/g, '');
    numbers = numbers.replace(/[01]/g, '');
    symbols = symbols.replace(/[|]/g, '');
  }

  let charset = '';
  const mandatoryChars: string[] = [];

  if (options.includeUppercase) {
    charset += uppercase;
    mandatoryChars.push(getRandomChar(uppercase));
  }
  if (options.includeLowercase) {
    charset += lowercase;
    mandatoryChars.push(getRandomChar(lowercase));
  }
  if (options.includeNumbers) {
    charset += numbers;
    mandatoryChars.push(getRandomChar(numbers));
  }
  if (options.includeSymbols) {
    charset += symbols;
    mandatoryChars.push(getRandomChar(symbols));
  }

  if (charset.length === 0) {
    charset = lowercase;
    mandatoryChars.push(getRandomChar(lowercase));
  }

  const remainingLength = Math.max(0, options.length - mandatoryChars.length);
  const result: string[] = [...mandatoryChars];

  const webCrypto = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const randomValues = new Uint32Array(remainingLength);
  webCrypto.getRandomValues(randomValues);

  for (let i = 0; i < remainingLength; i++) {
    result.push(charset[randomValues[i] % charset.length]);
  }

  // Shuffle using Fisher-Yates with CSPRNG
  for (let i = result.length - 1; i > 0; i--) {
    const rand = new Uint32Array(1);
    webCrypto.getRandomValues(rand);
    const j = rand[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

function getRandomChar(str: string): string {
  const webCrypto = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const rand = new Uint32Array(1);
  webCrypto.getRandomValues(rand);
  return str[rand[0] % str.length];
}

export function generateUUID(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 using crypto.getRandomValues
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function calculateSHA256(data: string | ArrayBuffer): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
