import { describe, it, expect } from 'vitest';
import { escapeCSVValue, rowsToCSV } from '@/features/Core/utils/csvUtils';

describe('escapeCSVValue', () => {
  it('leaves plain values alone and blanks null/undefined', () => {
    expect(escapeCSVValue('plain text')).toBe('plain text');
    expect(escapeCSVValue(42)).toBe('42');
    expect(escapeCSVValue(null)).toBe('');
    expect(escapeCSVValue(undefined)).toBe('');
  });

  it('quotes values containing delimiters, quotes, or line breaks', () => {
    expect(escapeCSVValue('a,b')).toBe('"a,b"');
    expect(escapeCSVValue('a;b')).toBe('"a;b"');
    expect(escapeCSVValue('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCSVValue('line one\nline two')).toBe('"line one\nline two"');
    expect(escapeCSVValue('line one\rline two')).toBe('"line one\rline two"');
  });

  it('neutralizes text that a spreadsheet would run as a formula', () => {
    expect(escapeCSVValue('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(escapeCSVValue('+1')).toBe("'+1");
    expect(escapeCSVValue('-cmd')).toBe("'-cmd");
    expect(escapeCSVValue('@import')).toBe("'@import");
    expect(escapeCSVValue('=HYPERLINK("x","y")')).toBe('"\'=HYPERLINK(""x"",""y"")"');
  });

  it('keeps negative numbers numeric', () => {
    expect(escapeCSVValue(-5)).toBe('-5');
  });
});

describe('rowsToCSV', () => {
  it('writes the header line then one escaped line per row, in header order', () => {
    const csv = rowsToCSV(['b', 'a'], [{ a: 'x,y', b: 1 }, { a: '', b: 2 }]);
    expect(csv).toBe('b,a\n1,"x,y"\n2,');
  });

  it('writes only the header line when there are no rows', () => {
    expect(rowsToCSV<{ a: string }>(['a'], [])).toBe('a');
  });
});
