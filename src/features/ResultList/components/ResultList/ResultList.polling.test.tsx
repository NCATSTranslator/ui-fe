import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderResultList, getRowNames, runningStatus, completeStatus, QueryFetchScript } from '@/test/renderResultList';
import { makeTestDiseaseSet } from '@/features/ResultList/utils/resultTestFixtures';
import { ResultSet } from '@/features/ResultList/types/results';

// Poll fast, with a per-test status-check limit: high by default so a loaded test
// runner can't hit it mid-scenario, and lowered only by the test of the limit itself.
const polling = vi.hoisted(() => ({ statusCheckLimit: 1000 }));
vi.mock('@/features/ResultList/utils/pollingConfig', () => ({
  REFETCH_INTERVAL: 20,
  get STATUS_CHECK_TIMEOUT() { return polling.statusCheckLimit; },
}));

/** The disease set trimmed to its first result (Aspirin), as an early partial response. */
const partialSet = (status: ResultSet['status'] = 'success'): ResultSet => {
  const set = makeTestDiseaseSet();
  set.status = status;
  set.data.results = set.data.results.slice(0, 1);
  return set;
};

// Polling runs on real timers, so give every wait headroom for a loaded test runner
const WAIT = { timeout: 4000 };
const waitForRows = (container: HTMLElement, names: string[]) =>
  waitFor(() => expect(getRowNames(container)).toEqual(names), WAIT);
const findSyncButton = async () =>
  within(await screen.findByTestId('status-probe', {}, WAIT)).findByText('Sync New Results', {}, WAIT);
const ERROR_TEXT = 'There was an error when processing your query. Please try again.';
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('ResultList polling', () => {
  beforeEach(() => {
    polling.statusCheckLimit = 1000;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows early results, offers newer ones when more ARAs report, and swaps them in on sync', async () => {
    const user = userEvent.setup();
    // Advanced step by step: a status poll that lands while a result fetch is in
    // flight is coalesced into it, so a fixed sequence would race the fast test interval.
    const script: QueryFetchScript = { status: [runningStatus(['ara-a'])], result: [partialSet()] };
    const { container } = renderResultList({ scripts: { Q1: script } });
    await waitForRows(container, ['Aspirin']);

    script.status = [runningStatus(['ara-a', 'ara-b'])];
    script.result = [makeTestDiseaseSet()];
    const sync = await findSyncButton();
    // Newer results are held back until the user asks, so the list doesn't reshuffle underneath them
    expect(getRowNames(container)).toEqual(['Aspirin']);

    script.status = [completeStatus(['ara-a', 'ara-b'])];
    await user.click(sync);
    await waitForRows(container, ['Zinc', 'Metformin', 'Aspirin']);
  });

  it('fetches results again when more ARAs report while a result fetch is still in flight', async () => {
    // /result #1 is slow; several status polls reporting a new ARA land before it returns
    const script: QueryFetchScript = { status: [runningStatus(['ara-a'])], result: [{ response: partialSet(), delayMs: 150 }] };
    const { container, countCalls } = renderResultList({ scripts: { Q1: script } });
    await waitFor(() => expect(countCalls('Q1', 'result')).toBe(1), WAIT);

    script.status = [runningStatus(['ara-a', 'ara-b'])];
    script.result = [makeTestDiseaseSet()];
    await waitForRows(container, ['Aspirin']);

    // The ARA that reported mid-fetch must trigger its own fetch once the first one lands
    await waitFor(() => expect(countCalls('Q1', 'result')).toBeGreaterThanOrEqual(2), WAIT);
    await findSyncButton();
  });

  it('still fetches the final results when the in-flight status reports new ARAs and completes at once', async () => {
    const script: QueryFetchScript = { status: [runningStatus(['ara-a'])], result: [{ response: partialSet(), delayMs: 150 }] };
    const { container, countCalls } = renderResultList({ scripts: { Q1: script } });
    await waitFor(() => expect(countCalls('Q1', 'result')).toBe(1), WAIT);

    // New ARA and completion in the same status, while /result #1 is still out
    script.status = [completeStatus(['ara-a', 'ara-b'])];
    script.result = [makeTestDiseaseSet()];
    await waitForRows(container, ['Aspirin']);
    await waitFor(() => expect(countCalls('Q1', 'result')).toBeGreaterThanOrEqual(2), WAIT);
    await findSyncButton();

    // Status polling has stopped
    const statusCalls = countCalls('Q1', 'status');
    await sleep(200);
    expect(countCalls('Q1', 'status')).toBe(statusCalls);
  });

  it('resumes status polling when a "complete" status is contradicted by a still-running result set', async () => {
    const { container, countCalls } = renderResultList({
      scripts: {
        Q1: {
          status: [completeStatus(['ara-a'])],
          result: [partialSet('running'), makeTestDiseaseSet()],
        },
      },
    });
    await waitForRows(container, ['Aspirin']);
    await findSyncButton();
    expect(countCalls('Q1', 'status')).toBeGreaterThanOrEqual(2);
    expect(countCalls('Q1', 'result')).toBeGreaterThanOrEqual(2);
  });

  it('stops polling after the status check limit and fetches whatever results exist', async () => {
    const { container, countCalls } = renderResultList({
      scripts: { Q1: { status: [runningStatus(['ara-a'])], result: [partialSet()] } },
    });
    // Let the first result fetch finish before the limit can trip, so the fetch the
    // limit triggers isn't coalesced into one still in flight
    await waitForRows(container, ['Aspirin']);
    const resultFetchesBeforeLimit = countCalls('Q1', 'result');
    polling.statusCheckLimit = 3;
    await waitFor(() => expect(countCalls('Q1', 'status')).toBeGreaterThanOrEqual(3), WAIT);

    // Polling stops: the status count settles (a poll already in flight may still land) and then holds
    let previous = -1;
    let current = countCalls('Q1', 'status');
    for (let i = 0; i < 20 && current !== previous; i++) {
      await sleep(100);
      previous = current;
      current = countCalls('Q1', 'status');
    }
    expect(current).toBe(previous);
    await sleep(200);
    expect(countCalls('Q1', 'status')).toBe(current);
    // Hitting the limit fetches results one last time
    await waitFor(() => expect(countCalls('Q1', 'result')).toBeGreaterThan(resultFetchesBeforeLimit), WAIT);
  });

  it('reports an error when the result fetch fails before any results are shown', async () => {
    const { countCalls } = renderResultList({ scripts: { Q1: { status: [completeStatus(['ara-a'])], result: ['error'] } } });
    await screen.findByText(ERROR_TEXT, {}, WAIT);
    expect(countCalls('Q1', 'result')).toBeGreaterThanOrEqual(1);
  });

  it('reports an error when the status fetch fails before any results are shown', async () => {
    const { countCalls } = renderResultList({ scripts: { Q1: { status: ['error'] } } });
    await screen.findByText(ERROR_TEXT, {}, WAIT);
    expect(countCalls('Q1', 'result')).toBe(0);
  });
});
