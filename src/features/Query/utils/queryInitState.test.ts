import { describe, it, expect } from 'vitest';
import { buildInitialQueryItemState } from './queryInitState';
import { queryTypes } from './queryTypes';

describe('buildInitialQueryItemState', () => {
  it('prefills smart query state from supported node params', () => {
    const state = buildInitialQueryItemState(null, 'TP53', 'NCBIGene:7157', 'biolink:Gene');

    expect(state.categoryUnsupported).toBe(false);
    expect(state.queryItem.type.filterType).toBe('Gene');
    expect(state.queryItem.node).toMatchObject({
      id: 'NCBIGene:7157',
      label: 'TP53',
      types: ['biolink:Gene'],
    });
    expect(state.inputText).toBe('TP53');
  });

  it('does not autofill when category is present but unmapped', () => {
    const state = buildInitialQueryItemState(
      null,
      'Heart',
      'UBERON:0000948',
      'biolink:AnatomicalEntity',
    );

    expect(state.categoryUnsupported).toBe(true);
    expect(state.queryItem.type).toBe(queryTypes[0]);
    expect(state.queryItem.node).toBeNull();
    expect(state.inputText).toBe('');
  });

  it('still uses an explicit preset type when category is unsupported', () => {
    const preset = queryTypes[3];
    const state = buildInitialQueryItemState(
      preset,
      'Heart',
      'UBERON:0000948',
      'biolink:AnatomicalEntity',
    );

    expect(state.categoryUnsupported).toBe(true);
    expect(state.queryItem.type).toBe(preset);
    expect(state.queryItem.node).toBeNull();
    expect(state.inputText).toBe('');
  });
});
