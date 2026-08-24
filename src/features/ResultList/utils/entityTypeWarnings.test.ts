import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { warnOnceOnEntityTypeMismatch, resetEntityTypeWarnings } from './entityTypeWarnings';

const validAnnotations = {
  chemical: {
    approval: null, clinical_trials: null, descriptions: null, indications: null,
    otc_status: null, roles: null, synonyms: null,
  },
  disease: { clinical_trials: null, curies: null, descriptions: null, synonyms: null },
  gene: { descriptions: null, name: null, species: null, tdl: null },
};

const makeNode = (id: string, annotations: unknown) => ({
  annotations, aras: [], curies: [id], descriptions: [], id, names: [`Node ${id}`],
  other_names: {}, provenance: [], signature: id, source_time: '', synonyms: [],
  tags: {}, types: ['biolink:Gene'],
});

describe('warnOnceOnEntityTypeMismatch', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetEntityTypeWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    resetEntityTypeWarnings();
  });

  it('stays silent for an entity that matches its type', () => {
    warnOnceOnEntityTypeMismatch('node', 'n-1', makeNode('n-1', validAnnotations));
    expect(warn).not.toHaveBeenCalled();
  });

  it('reports a mismatched entity only once, however many times it is checked', () => {
    const node = makeNode('n-1', {});

    warnOnceOnEntityTypeMismatch('node', 'n-1', node);
    const callsAfterFirstCheck = warn.mock.calls.length;
    expect(callsAfterFirstCheck).toBeGreaterThan(0);

    // Repeat checks stand in for the re-renders a hover triggers.
    for (let i = 0; i < 50; i++) {
      warnOnceOnEntityTypeMismatch('node', 'n-1', node);
    }
    expect(warn.mock.calls.length).toBe(callsAfterFirstCheck);
  });

  it('reports a missing entity without running the checkers', () => {
    warnOnceOnEntityTypeMismatch('edge', 'e-1', undefined);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('missing edge with id: e-1');
  });

  it('stops checking once the report budget is spent', () => {
    for (let i = 0; i < 40; i++) {
      warnOnceOnEntityTypeMismatch('node', `n-${i}`, makeNode(`n-${i}`, {}));
    }
    const callsAfterBudget = warn.mock.calls.length;

    warnOnceOnEntityTypeMismatch('node', 'n-fresh', makeNode('n-fresh', {}));
    expect(warn.mock.calls.length).toBe(callsAfterBudget);
  });
});
