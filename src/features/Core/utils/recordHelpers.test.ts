import { describe, it, expect } from 'vitest';
import { reuseRecordIfEqual } from '@/features/Core/utils/recordHelpers';

describe('reuseRecordIfEqual', () => {
  it('returns the previous record when keys and value references match', () => {
    const shared = { name: 'a' };
    const prev = { x: shared };
    const next = { x: shared };
    expect(reuseRecordIfEqual(prev, next)).toBe(prev);
  });

  it('returns the next record when contents differ', () => {
    const prev = { x: { name: 'a' } };
    const next = { x: { name: 'a' } };
    expect(reuseRecordIfEqual(prev, next)).toBe(next);
  });
});
