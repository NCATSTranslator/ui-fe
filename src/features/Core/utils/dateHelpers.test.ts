import { describe, it, expect } from 'vitest';
import { getLocalDateStamp } from '@/features/Core/utils/dateHelpers';

describe('getLocalDateStamp', () => {
  it('uses the local calendar date, zero-padded', () => {
    expect(getLocalDateStamp(new Date(2026, 0, 5, 0, 15, 0))).toBe('2026-01-05');
    expect(getLocalDateStamp(new Date(2026, 10, 16, 23, 45, 0))).toBe('2026-11-16');
  });
});
