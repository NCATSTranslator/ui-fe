import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { COLOR_MODE_STORAGE_KEY } from '@/redux/storageKeys';

const loadSlice = async () => {
  vi.resetModules();
  return import('./colorModeSlice');
};

describe('colorModeSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to enabled when nothing is stored', async () => {
    const { default: reducer } = await loadSlice();
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ enabled: true });
  });

  it('restores a stored disabled state', async () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, JSON.stringify({ enabled: false }));
    const { default: reducer } = await loadSlice();
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ enabled: false });
  });

  it('falls back to enabled when the stored value is malformed', async () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'not json');
    const { default: reducer } = await loadSlice();
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ enabled: true });
  });

  it('falls back to enabled when the stored value has the wrong shape', async () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, JSON.stringify({ enabled: 'yes' }));
    const { default: reducer } = await loadSlice();
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ enabled: true });
  });

  it('falls back to enabled when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { default: reducer } = await loadSlice();
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ enabled: true });
  });

  it('sets the enabled flag', async () => {
    const { default: reducer, setColorModeEnabled } = await loadSlice();
    expect(reducer({ enabled: true }, setColorModeEnabled(false))).toEqual({ enabled: false });
    expect(reducer({ enabled: false }, setColorModeEnabled(true))).toEqual({ enabled: true });
  });

  it('selects the enabled flag from the root state', async () => {
    const { currentColorModeEnabled } = await loadSlice();
    expect(currentColorModeEnabled({ colorMode: { enabled: false } })).toBe(false);
  });
});
