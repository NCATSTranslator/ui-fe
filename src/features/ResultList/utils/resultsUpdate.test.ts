import { describe, it, expect } from 'vitest';
import { computeResultsUpdate, ResultsUpdateInputs } from '@/features/ResultList/utils/resultsUpdate';
import { makeTestDiseaseSet, APPROVED_TAG } from '@/features/ResultList/utils/resultTestFixtures';
import { FILTERING_CONSTANTS } from '@/features/ResultFiltering/utils/filterFunctions';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { Result, ResultSet } from '@/features/ResultList/types/results';
import { Save, SaveGroup } from '@/features/UserAuth/utils/userApi';

const byName = (_summary: ResultSet, results: Result[]) => [...results].sort((a, b) => a.drug_name.localeCompare(b.drug_name));
const names = (results: Result[]) => results.map(r => r.drug_name);
const approvedFilter: Filter = { id: APPROVED_TAG, name: 'Approved', value: '', includeWeight: FILTERING_CONSTANTS.WEIGHT.LIGHT, excludeWeight: FILTERING_CONSTANTS.WEIGHT.HEAVY };

const baseInputs = (): ResultsUpdateInputs => ({
  update: { mode: 'rebuild', summary: makeTestDiseaseSet() },
  rawResults: null,
  originalResults: [],
  activeFilters: [],
  sortType: 'nameLowHigh',
  isPathfinder: false,
  userSaves: null,
  pathFilterState: null,
  visibleResultIds: new Set(),
  sortResults: byName,
});

/** Runs a rebuild and returns inputs for a follow-up update against its outcome. */
const rebuilt = () => {
  const inputs = baseInputs();
  const outcome = computeResultsUpdate(inputs);
  if (!outcome?.filtering) throw new Error('rebuild should filter');
  const { filtering } = outcome;
  return {
    outcome,
    next: (update: ResultsUpdateInputs['update'], extra: Partial<ResultsUpdateInputs> = {}): ResultsUpdateInputs => ({
      ...inputs,
      update,
      rawResults: outcome.summary,
      originalResults: filtering.originalResults,
      pathFilterState: outcome.pathFilterState,
      visibleResultIds: new Set(outcome.formattedResults.map(r => r.id)),
      ...extra,
    }),
  };
};

describe('computeResultsUpdate', () => {
  it('returns null when there is no result set to work from', () => {
    expect(computeResultsUpdate({ ...baseInputs(), update: { mode: 'sort' } })).toBeNull();
    expect(computeResultsUpdate({ ...baseInputs(), update: { mode: 'rebuild', summary: null } })).toBeNull();
  });

  it('rebuilds from a result set: sorted results, a cloned canonical list, path state, and facets', () => {
    const summary = makeTestDiseaseSet();
    const outcome = computeResultsUpdate({ ...baseInputs(), update: { mode: 'rebuild', summary } });
    expect(outcome).not.toBeNull();
    expect(names(outcome!.formattedResults)).toEqual(['Aspirin', 'Metformin', 'Zinc']);
    expect(outcome!.filtering?.originalResults).toHaveLength(3);
    expect(outcome!.filtering?.originalResults).not.toBe(summary.data.results);
    expect(Object.keys(outcome!.pathFilterState).sort()).toEqual(['p1', 'p2', 'p3']);
    expect(outcome!.filtering?.availableFilters[APPROVED_TAG]?.count).toBe(2);
    expect(outcome!.filtering?.shouldResetPage).toBe(false);
  });

  it('refilters the existing results against new filters without touching the canonical list', () => {
    const { next } = rebuilt();
    const outcome = computeResultsUpdate(next({ mode: 'refilter', filters: [approvedFilter] }));
    expect(names(outcome!.formattedResults)).toEqual(['Aspirin', 'Zinc']);
    expect(outcome!.filtering?.originalResults).toHaveLength(3);
    expect(outcome!.filtering?.shouldResetPage).toBe(true);
  });

  it('sorts only the visible results and carries path filter state forward as a copy', () => {
    const { outcome: first, next } = rebuilt();
    const filtered = computeResultsUpdate(next({ mode: 'refilter', filters: [approvedFilter] }))!;
    const inputs = next({ mode: 'sort' }, {
      sortType: 'nameHighLow',
      sortResults: (s, r) => byName(s, r).reverse(),
      pathFilterState: filtered.pathFilterState,
      visibleResultIds: new Set(filtered.formattedResults.map(r => r.id)),
    });
    const sorted = computeResultsUpdate(inputs)!;
    expect(names(sorted.formattedResults)).toEqual(['Zinc', 'Aspirin']);
    expect(sorted.filtering).toBeUndefined();
    expect(sorted.pathFilterState).toEqual(filtered.pathFilterState);
    expect(sorted.pathFilterState).not.toBe(filtered.pathFilterState);
    expect(first.formattedResults).toHaveLength(3);
  });

  it('falls back to rebuilding from the set when asked to refilter before anything was loaded', () => {
    const summary = makeTestDiseaseSet();
    const outcome = computeResultsUpdate({ ...baseInputs(), update: { mode: 'refilter', filters: [] }, rawResults: summary, originalResults: [] });
    expect(names(outcome!.formattedResults)).toEqual(['Aspirin', 'Metformin', 'Zinc']);
    expect(Object.keys(outcome!.pathFilterState).sort()).toEqual(['p1', 'p2', 'p3']);
  });

  it('injects bookmark tags from user saves into the summary and results', () => {
    const save = { id: 1, notes: '', object_ref: 'r-zinc' } as Save;
    const userSaves = { saves: new Map([['r-zinc', save]]) } as unknown as SaveGroup;
    const outcome = computeResultsUpdate({ ...baseInputs(), userSaves })!;
    const bookmarkTag = FILTERING_CONSTANTS.DYNAMIC_TAG.BOOKMARK.id;
    expect(outcome.summary.data.tags[bookmarkTag]).toBeDefined();
    const zinc = outcome.formattedResults.find(r => r.id === 'r-zinc')!;
    expect(zinc.tags[bookmarkTag]).toBeDefined();
    expect(outcome.filtering?.availableFilters[bookmarkTag]?.count).toBe(1);
  });
});
