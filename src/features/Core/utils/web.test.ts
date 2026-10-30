import { describe, it, expect } from 'vitest';
import { encodeBase64Url, decodeBase64Url, getDecodedParamsFromSearch } from '@/features/Core/utils/web';

describe('base64url helpers', () => {
  it('round-trips text, including characters outside Latin-1', () => {
    const text = 'l=β-blocker café&i=MONDO:0005267';
    const encoded = encodeBase64Url(text);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeBase64Url(encoded)).toBe(text);
  });

  it('still reads links encoded before text was UTF-8 encoded', () => {
    // The old encoder ran btoa on the raw string: one byte per Latin-1 character.
    const legacy = window.btoa('l=Sjögren syndrome&t=0');
    expect(decodeBase64Url(legacy)).toBe('l=Sjögren syndrome&t=0');
  });

  it('accepts standard base64 with padding', () => {
    expect(decodeBase64Url(window.btoa('a=1'))).toBe('a=1');
  });
});

describe('getDecodedParamsFromSearch', () => {
  it('decodes a hashed segment and keeps the plain parameters beside it', () => {
    const hashed = encodeBase64Url('l=Heart Disease&i=MONDO:0005267&t=0');
    expect(getDecodedParamsFromSearch(`?${hashed}&q=pk-1&f=abc`))
      .toBe('l=Heart Disease&i=MONDO:0005267&t=0&q=pk-1&f=abc');
  });
});
