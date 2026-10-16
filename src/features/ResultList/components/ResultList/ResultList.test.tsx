import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderResultList, getRowNames } from '@/test/renderResultList';
import { makeTestEdge, makeTestNode, makeTestPath, makeTestResult, makeTestResultSet } from '@/features/ResultList/utils/resultTestFixtures';
import { ResultSet, Score } from '@/features/ResultList/types/results';

const score = (value: number): Score => ({ main: value, confidence: value, novelty: value, clinical_evidence: value, normalized_score: value });
const tag = (name: string) => ({ name, description: '' });
const APPROVED = 'r/cc/approved';
const PHASE_3 = 'r/cc/phase3';
const TREATS = 'p/pred/treats';

/**
 * Three drugs for one disease. Scores put Zinc first by default so a name sort
 * visibly reorders; Aspirin and Zinc share the "Approved" development stage.
 */
const makeDiseaseSet = (): ResultSet => {
  const drug = (id: string, name: string) => makeTestNode(id, name);
  const set = makeTestResultSet(
    {
      e1: makeTestEdge('e1', { subject: 'aspirin', object: 'disease', predicate: 'biolink:treats' }),
      e2: makeTestEdge('e2', { subject: 'metformin', object: 'disease', predicate: 'biolink:treats' }),
      e3: makeTestEdge('e3', { subject: 'zinc', object: 'disease', predicate: 'biolink:treats' }),
    },
    {
      aspirin: drug('aspirin', 'Aspirin'),
      metformin: drug('metformin', 'Metformin'),
      zinc: drug('zinc', 'Zinc'),
      disease: makeTestNode('disease', 'Type 2 Diabetes'),
    },
  );
  const pathTags = { [TREATS]: { id: TREATS, description: tag('treats') } };
  set.data.paths = {
    p1: makeTestPath({ id: 'p1', subgraph: ['aspirin', 'e1', 'disease'], tags: pathTags }),
    p2: makeTestPath({ id: 'p2', subgraph: ['metformin', 'e2', 'disease'], tags: pathTags }),
    p3: makeTestPath({ id: 'p3', subgraph: ['zinc', 'e3', 'disease'], tags: pathTags }),
  };
  set.data.tags = { [APPROVED]: tag('Approved'), [PHASE_3]: tag('Phase 3'), [TREATS]: tag('treats') };
  set.data.results = [
    makeTestResult('r-aspirin', { drug_name: 'Aspirin', subject: 'aspirin', object: 'disease', paths: ['p1'], scores: [score(0.1)], tags: { [APPROVED]: { id: APPROVED, description: tag('Approved') } } }),
    makeTestResult('r-metformin', { drug_name: 'Metformin', subject: 'metformin', object: 'disease', paths: ['p2'], scores: [score(0.5)], tags: { [PHASE_3]: { id: PHASE_3, description: tag('Phase 3') } } }),
    makeTestResult('r-zinc', { drug_name: 'Zinc', subject: 'zinc', object: 'disease', paths: ['p3'], scores: [score(0.9)], tags: { [APPROVED]: { id: APPROVED, description: tag('Approved') } } }),
  ];
  return set;
};

const makeOtherSet = (): ResultSet => {
  const set = makeTestResultSet(
    { e1: makeTestEdge('e1', { subject: 'ibuprofen', object: 'disease2' }) },
    { ibuprofen: makeTestNode('ibuprofen', 'Ibuprofen'), disease2: makeTestNode('disease2', 'Headache') },
  );
  set.data.paths = { p1: makeTestPath({ id: 'p1', subgraph: ['ibuprofen', 'e1', 'disease2'] }) };
  set.data.results = [makeTestResult('r-ibuprofen', { drug_name: 'Ibuprofen', subject: 'ibuprofen', object: 'disease2', paths: ['p1'], scores: [score(0.5)] })];
  return set;
};

const waitForRows = (container: HTMLElement, names: string[]) =>
  waitFor(() => expect(getRowNames(container)).toEqual(names));

describe('ResultList', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads results through the status/result fetches and lists them by score', async () => {
    const { container } = renderResultList({ resultSets: { Q1: makeDiseaseSet() } });
    await waitForRows(container, ['Zinc', 'Metformin', 'Aspirin']);
    expect(screen.getByText('Showing', { exact: false })).toBeInTheDocument();
  });

  it('re-sorts by name when the Name column is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderResultList({ resultSets: { Q1: makeDiseaseSet() } });
    await waitForRows(container, ['Zinc', 'Metformin', 'Aspirin']);

    await user.click(screen.getByText('Name'));
    await waitForRows(container, ['Aspirin', 'Metformin', 'Zinc']);

    await user.click(screen.getByText('Name'));
    await waitForRows(container, ['Zinc', 'Metformin', 'Aspirin']);
    expect(getRowNames(container)).toEqual(['Zinc', 'Metformin', 'Aspirin']);
  });

  it('narrows the list when a facet is included, and restores it when toggled off', async () => {
    const user = userEvent.setup();
    const { container } = renderResultList({ resultSets: { Q1: makeDiseaseSet() } });
    await waitForRows(container, ['Zinc', 'Metformin', 'Aspirin']);

    const probe = await screen.findByTestId('filters-probe');
    await user.click(within(probe).getByText('Development Stage'));
    const approved = await waitFor(() => {
      const el = probe.querySelector('[data-facet-name="Approved"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });

    await user.click(within(approved).getByLabelText('Include'));
    await waitForRows(container, ['Zinc', 'Aspirin']);

    await user.click(within(approved).getByLabelText('Include'));
    await waitForRows(container, ['Zinc', 'Metformin', 'Aspirin']);
  });

  it('resets and loads a different result set when the query ID changes', async () => {
    const { container, router } = renderResultList({ resultSets: { Q1: makeDiseaseSet(), Q2: makeOtherSet() } });
    await waitForRows(container, ['Zinc', 'Metformin', 'Aspirin']);

    await act(async () => { await router.navigate('/results?q=Q2&t=0&l=Headache&i=MONDO:0005277'); });
    await waitForRows(container, ['Ibuprofen']);
    expect(getRowNames(container)).toEqual(['Ibuprofen']);
  });
});
