import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderResultList, getRowNames } from '@/test/renderResultList';
import { makeTestEdge, makeTestNode, makeTestPath, makeTestResult, makeTestResultSet, makeTestDiseaseSet, makeTestScore } from '@/features/ResultList/utils/resultTestFixtures';
import { ResultSet } from '@/features/ResultList/types/results';

const makeOtherSet = (): ResultSet => {
  const set = makeTestResultSet(
    { e1: makeTestEdge('e1', { subject: 'ibuprofen', object: 'disease2' }) },
    { ibuprofen: makeTestNode('ibuprofen', 'Ibuprofen'), disease2: makeTestNode('disease2', 'Headache') },
  );
  set.data.paths = { p1: makeTestPath({ id: 'p1', subgraph: ['ibuprofen', 'e1', 'disease2'] }) };
  set.data.results = [makeTestResult('r-ibuprofen', { drug_name: 'Ibuprofen', subject: 'ibuprofen', object: 'disease2', paths: ['p1'], scores: [makeTestScore(0.5)] })];
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
    const { container } = renderResultList({ resultSets: { Q1: makeTestDiseaseSet() } });
    await waitForRows(container, ['Zinc', 'Metformin', 'Aspirin']);
    expect(screen.getByText('Showing', { exact: false })).toBeInTheDocument();
  });

  it('re-sorts by name when the Name column is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderResultList({ resultSets: { Q1: makeTestDiseaseSet() } });
    await waitForRows(container, ['Zinc', 'Metformin', 'Aspirin']);

    await user.click(screen.getByText('Name'));
    await waitForRows(container, ['Aspirin', 'Metformin', 'Zinc']);

    await user.click(screen.getByText('Name'));
    await waitForRows(container, ['Zinc', 'Metformin', 'Aspirin']);
    expect(getRowNames(container)).toEqual(['Zinc', 'Metformin', 'Aspirin']);
  });

  it('narrows the list when a facet is included, and restores it when toggled off', async () => {
    const user = userEvent.setup();
    const { container } = renderResultList({ resultSets: { Q1: makeTestDiseaseSet() } });
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
    const { container, router } = renderResultList({ resultSets: { Q1: makeTestDiseaseSet(), Q2: makeOtherSet() } });
    await waitForRows(container, ['Zinc', 'Metformin', 'Aspirin']);

    await act(async () => { await router.navigate('/results?q=Q2&t=0&l=Headache&i=MONDO:0005277'); });
    await waitForRows(container, ['Ibuprofen']);
    expect(getRowNames(container)).toEqual(['Ibuprofen']);
  });
});
