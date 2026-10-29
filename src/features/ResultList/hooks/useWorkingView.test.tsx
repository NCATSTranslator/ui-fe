import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useWorkingView, { WORKING_VIEW_SAVE_DEBOUNCE_MS } from '@/features/ResultList/hooks/useWorkingView';
import { getWorkingView, setWorkingView, WorkingView } from '@/features/ResultFiltering/utils/workingViewApi';
import { Filter, Filters } from '@/features/ResultFiltering/types/filters';
import { WorkingViewState } from '@/features/ResultFiltering/utils/workingViewApi';
import { User } from '@/features/UserAuth/types/user';

vi.mock('@/features/ResultFiltering/utils/workingViewApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/ResultFiltering/utils/workingViewApi')>();
  return { ...actual, getWorkingView: vi.fn(), setWorkingView: vi.fn() };
});

const user = { id: 'user-1' } as unknown as User;
const available: Filters = {
  'r/pc/approved': { name: 'Approved', count: 3, includeWeight: 1, excludeWeight: 2 },
};
const approved: Filter = { id: 'r/pc/approved', name: 'Approved', count: 3, includeWeight: 1, excludeWeight: 2, value: 'Approved', negated: false };
const aspirin: Filter = { id: 'g/str', name: '', value: 'aspirin', negated: false };

const makeView = (pk: string, filters: Filter[]): WorkingView => ({
  user_id: 'user-1',
  pk,
  version: 1,
  state: { filters: filters.map((f) => ({ id: f.id, name: f.name, value: f.value ?? '', negated: f.negated ?? false })) },
  time_updated: '2026-10-28T00:00:00.000Z',
});

interface Props {
  user: User | null;
  currentQueryID: string | null;
  activeFilters: Filter[];
  hasResults: boolean;
  urlState: WorkingViewState | null;
}

const urlStateOf = (filters: Filter[]): WorkingViewState => makeView('url', filters).state as WorkingViewState;

const renderWorkingView = (initial: Partial<Props> = {}) => {
  const handleSetFilters = vi.fn();
  const defaults: Props = { user, currentQueryID: 'pk-1', activeFilters: [], hasResults: false, urlState: null };
  const hook = renderHook(
    (props: Props) => useWorkingView({ ...props, availableFilters: available, handleSetFilters }),
    { initialProps: { ...defaults, ...initial } },
  );
  const update = async (props: Partial<Props>) => {
    await act(async () => { hook.rerender({ ...defaults, ...initial, ...props }); });
  };
  return { ...hook, handleSetFilters, update };
};

const settle = () => act(async () => { await Promise.resolve(); });
const elapse = (ms: number) => act(async () => { vi.advanceTimersByTime(ms); });

describe('useWorkingView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getWorkingView).mockReset();
    vi.mocked(setWorkingView).mockReset();
    vi.mocked(setWorkingView).mockResolvedValue(makeView('pk-1', []));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not talk to the server without a user, but still initializes once results exist', async () => {
    const { result, update } = renderWorkingView({ user: null });
    expect(result.current.initialized).toBe(false);
    await update({ user: null, activeFilters: [aspirin], hasResults: true });
    expect(result.current.initialized).toBe(true);
    await elapse(WORKING_VIEW_SAVE_DEBOUNCE_MS * 2);
    expect(getWorkingView).not.toHaveBeenCalled();
    expect(setWorkingView).not.toHaveBeenCalled();
  });

  it('applies the filters from the URL for a logged-out user', async () => {
    const { handleSetFilters, update } = renderWorkingView({ user: null, urlState: urlStateOf([approved]) });
    await update({ user: null, urlState: urlStateOf([approved]), hasResults: true });
    expect(handleSetFilters).toHaveBeenCalledWith([approved]);
  });

  it('prefers the URL filters over the saved view and does not save them until the user changes something', async () => {
    vi.mocked(getWorkingView).mockResolvedValue(makeView('pk-1', [approved]));
    const { handleSetFilters, result, update } = renderWorkingView({ urlState: urlStateOf([aspirin]) });
    await settle();
    expect(result.current.initialized).toBe(false);

    await update({ urlState: urlStateOf([aspirin]), hasResults: true });
    expect(handleSetFilters).toHaveBeenCalledTimes(1);
    expect(handleSetFilters).toHaveBeenCalledWith([expect.objectContaining({ id: 'g/str', value: 'aspirin' })]);
    expect(result.current.initialized).toBe(true);

    await update({ urlState: urlStateOf([aspirin]), hasResults: true, activeFilters: [aspirin] });
    await elapse(WORKING_VIEW_SAVE_DEBOUNCE_MS * 2);
    expect(setWorkingView).not.toHaveBeenCalled();

    await update({ urlState: urlStateOf([aspirin]), hasResults: true, activeFilters: [aspirin, approved] });
    await elapse(WORKING_VIEW_SAVE_DEBOUNCE_MS);
    expect(setWorkingView).toHaveBeenCalledTimes(1);
  });

  it('applies URL filters before the saved view has loaded and ignores the view when it arrives', async () => {
    let resolveView: (view: WorkingView) => void = () => {};
    vi.mocked(getWorkingView).mockReturnValue(new Promise((resolve) => { resolveView = resolve; }));
    const { handleSetFilters, update } = renderWorkingView({ urlState: urlStateOf([aspirin]), hasResults: true });
    await settle();
    expect(handleSetFilters).toHaveBeenCalledTimes(1);

    await act(async () => { resolveView(makeView('pk-1', [approved])); });
    await update({ urlState: urlStateOf([aspirin]), hasResults: true, activeFilters: [aspirin] });
    expect(handleSetFilters).toHaveBeenCalledTimes(1);
    await elapse(WORKING_VIEW_SAVE_DEBOUNCE_MS * 2);
    expect(setWorkingView).not.toHaveBeenCalled();
  });

  it('applies the saved filters once results exist and does not save them back', async () => {
    vi.mocked(getWorkingView).mockResolvedValue(makeView('pk-1', [approved]));
    const { handleSetFilters, result, update } = renderWorkingView();
    await settle();
    expect(handleSetFilters).not.toHaveBeenCalled();
    expect(result.current.initialized).toBe(false);

    await update({ hasResults: true });
    expect(handleSetFilters).toHaveBeenCalledTimes(1);
    expect(handleSetFilters).toHaveBeenCalledWith([approved]);
    expect(result.current.initialized).toBe(true);

    await update({ hasResults: true, activeFilters: [approved] });
    await elapse(WORKING_VIEW_SAVE_DEBOUNCE_MS * 2);
    expect(setWorkingView).not.toHaveBeenCalled();
  });

  it('does not save the empty initial filters before a saved view is applied', async () => {
    vi.mocked(getWorkingView).mockResolvedValue(makeView('pk-1', [approved]));
    renderWorkingView();
    await settle();
    await elapse(WORKING_VIEW_SAVE_DEBOUNCE_MS * 2);
    expect(setWorkingView).not.toHaveBeenCalled();
  });

  it('saves a changed filter set once after the debounce', async () => {
    vi.mocked(getWorkingView).mockResolvedValue(null);
    const { update } = renderWorkingView();
    await settle();

    await update({ hasResults: true, activeFilters: [aspirin] });
    await update({ hasResults: true, activeFilters: [aspirin, approved] });
    expect(setWorkingView).not.toHaveBeenCalled();

    await elapse(WORKING_VIEW_SAVE_DEBOUNCE_MS);
    expect(setWorkingView).toHaveBeenCalledTimes(1);
    expect(setWorkingView).toHaveBeenCalledWith('pk-1', {
      filters: [
        { id: 'g/str', name: '', value: 'aspirin', negated: false },
        { id: 'r/pc/approved', name: 'Approved', value: 'Approved', negated: false },
      ],
    });
  });

  it('saves clearing the filters', async () => {
    vi.mocked(getWorkingView).mockResolvedValue(makeView('pk-1', [approved]));
    const { update } = renderWorkingView();
    await settle();
    await update({ hasResults: true });
    await update({ hasResults: true, activeFilters: [approved] });
    await update({ hasResults: true, activeFilters: [] });
    await elapse(WORKING_VIEW_SAVE_DEBOUNCE_MS);
    expect(setWorkingView).toHaveBeenCalledTimes(1);
    expect(setWorkingView).toHaveBeenCalledWith('pk-1', { filters: [] });
  });

  it('flushes a pending save and loads the new view when the query changes', async () => {
    vi.mocked(getWorkingView).mockImplementation(async (pk: string) =>
      (pk === 'pk-2' ? makeView('pk-2', [aspirin]) : null));
    const { handleSetFilters, update } = renderWorkingView();
    await settle();
    await update({ hasResults: true, activeFilters: [approved] });

    await update({ currentQueryID: 'pk-2', hasResults: false, activeFilters: [] });
    expect(setWorkingView).toHaveBeenCalledTimes(1);
    expect(setWorkingView).toHaveBeenCalledWith('pk-1', {
      filters: [{ id: 'r/pc/approved', name: 'Approved', value: 'Approved', negated: false }],
    });
    expect(getWorkingView).toHaveBeenLastCalledWith('pk-2');

    await settle();
    await update({ currentQueryID: 'pk-2', hasResults: true, activeFilters: [] });
    expect(handleSetFilters).toHaveBeenCalledWith([expect.objectContaining({ id: 'g/str', value: 'aspirin' })]);
  });

  it('leaves the view alone and never initializes when loading it fails', async () => {
    vi.mocked(getWorkingView).mockRejectedValue(new Error('HTTP Error: 500'));
    const { result, update } = renderWorkingView();
    await settle();
    await update({ hasResults: true, activeFilters: [aspirin] });
    await elapse(WORKING_VIEW_SAVE_DEBOUNCE_MS * 2);
    expect(setWorkingView).not.toHaveBeenCalled();
    expect(result.current.initialized).toBe(false);
  });
});
