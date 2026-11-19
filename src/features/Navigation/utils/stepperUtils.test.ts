import { describe, it, expect } from 'vitest';
import { getAdjacentItems } from '@/features/Navigation/utils/stepperUtils';

const is = (target: string) => (item: string) => item === target;

describe('getAdjacentItems', () => {
  const items = ['a', 'b', 'c'];

  it('returns both neighbours for an item in the middle', () => {
    expect(getAdjacentItems(items, is('b'))).toEqual({ index: 1, previous: 'a', next: 'c' });
  });

  it('has no previous at the start and no next at the end', () => {
    expect(getAdjacentItems(items, is('a'))).toEqual({ index: 0, previous: null, next: 'b' });
    expect(getAdjacentItems(items, is('c'))).toEqual({ index: 2, previous: 'b', next: null });
  });

  it('has no neighbours when the item is the only one', () => {
    expect(getAdjacentItems(['a'], is('a'))).toEqual({ index: 0, previous: null, next: null });
  });

  it('has no neighbours when the item is not in the sequence', () => {
    expect(getAdjacentItems(items, is('z'))).toEqual({ index: -1, previous: null, next: null });
    expect(getAdjacentItems([], is('a'))).toEqual({ index: -1, previous: null, next: null });
  });
});
