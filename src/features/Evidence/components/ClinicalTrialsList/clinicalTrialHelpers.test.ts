import { describe, it, expect } from 'vitest';
import { TrialObject } from '@/features/Evidence/types/evidence.d';
import {
  getTrialDisplayId,
  getTrialSummary,
  getTrialYear,
  sortTrials,
} from '@/features/Evidence/components/ClinicalTrialsList/clinicalTrialHelpers';

const makeTrial = (id: string, overrides: Partial<TrialObject> = {}): TrialObject => ({
  child: false, id, phase: 0, size: 0, start_date: '', status: 'UNKNOWN', url: '', ...overrides,
});

describe('sortTrials', () => {
  it('orders trials by start date in either direction, without changing the input', () => {
    const trials = [
      makeTrial('a', { start_date: '2015-03-01' }),
      makeTrial('b', { start_date: '2023-01-15' }),
      makeTrial('c', { start_date: '2008-11' }),
      makeTrial('d', { start_date: '2023-06-01' }),
    ];
    expect(sortTrials(trials, 'dateHighLow').map(trial => trial.id)).toEqual(['d', 'b', 'a', 'c']);
    expect(sortTrials(trials, 'dateLowHigh').map(trial => trial.id)).toEqual(['c', 'a', 'b', 'd']);
    expect(trials.map(trial => trial.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('puts trials without a readable start date last, in their original order', () => {
    const trials = [
      makeTrial('none'),
      makeTrial('old', { start_date: '1999-01-01' }),
      makeTrial('bad', { start_date: 'not a date' }),
      makeTrial('new', { start_date: '2020-01-01' }),
    ];
    expect(sortTrials(trials, 'dateHighLow').map(trial => trial.id)).toEqual(['new', 'old', 'none', 'bad']);
    expect(sortTrials(trials, 'dateLowHigh').map(trial => trial.id)).toEqual(['old', 'new', 'none', 'bad']);
  });

  it('orders trials by title in either direction, with untitled trials last', () => {
    const trials = [
      makeTrial('b', { title: 'Beta study' }),
      makeTrial('untitled'),
      makeTrial('c', { title: 'Gamma study' }),
      makeTrial('a', { title: 'Alpha study' }),
    ];
    expect(sortTrials(trials, 'titleLowHigh').map(trial => trial.id)).toEqual(['a', 'b', 'c', 'untitled']);
    expect(sortTrials(trials, 'titleHighLow').map(trial => trial.id)).toEqual(['c', 'b', 'a', 'untitled']);
  });

  it('orders trials by participants in either direction, with unknown counts last', () => {
    const trials = [
      makeTrial('mid', { size: 100 }),
      makeTrial('unknown'),
      makeTrial('big', { size: 5000 }),
      makeTrial('small', { size: 12 }),
    ];
    expect(sortTrials(trials, 'participantsHighLow').map(trial => trial.id))
      .toEqual(['big', 'mid', 'small', 'unknown']);
    expect(sortTrials(trials, 'participantsLowHigh').map(trial => trial.id))
      .toEqual(['small', 'mid', 'big', 'unknown']);
  });
});

describe('trial display helpers', () => {
  it('reads the start year', () => {
    expect(getTrialYear('2019-05-01')).toBe('2019');
    expect(getTrialYear('')).toBe('');
    expect(getTrialYear('not a date')).toBe('');
  });

  it('shows the NCT id without a CURIE prefix', () => {
    expect(getTrialDisplayId('clinicaltrials:NCT00375752')).toBe('NCT00375752');
    expect(getTrialDisplayId('NCT00375752')).toBe('NCT00375752');
    expect(getTrialDisplayId(undefined)).toBe('');
  });

  it('summarizes phase, enrollment, and status, leaving out what is missing', () => {
    const trial = makeTrial('a', { phase: 4, size: 1168, type: 'anticipated', status: 'NOT_YET_RECRUITING' });
    expect(getTrialSummary(trial, undefined)).toEqual(['Phase 4', '1,168 anticipated', 'Not yet recruiting']);
    expect(getTrialSummary(makeTrial('b'), undefined)).toEqual([]);
  });
});
