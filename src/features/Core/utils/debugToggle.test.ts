import { describe, it, expect, afterEach } from 'vitest';
import { createDebugToggle } from '@/features/Core/utils/debugToggle';

const GLOBAL_NAME = '__debugToggleTest';
const globalWindow = () => window as unknown as Record<string, unknown>;

describe('createDebugToggle', () => {
  afterEach(() => {
    delete globalWindow()[GLOBAL_NAME];
  });

  it('defaults to off', () => {
    expect(createDebugToggle(GLOBAL_NAME).isEnabled()).toBe(false);
  });

  it('respects enabledByDefault', () => {
    expect(createDebugToggle(GLOBAL_NAME, true).isEnabled()).toBe(true);
  });

  it('turns logging on and off through set', () => {
    const toggle = createDebugToggle(GLOBAL_NAME);
    toggle.set(true);
    expect(toggle.isEnabled()).toBe(true);
    toggle.set(false);
    expect(toggle.isEnabled()).toBe(false);
  });

  it('exposes the setter on window under the given name', () => {
    const toggle = createDebugToggle(GLOBAL_NAME);
    expect(globalWindow()[GLOBAL_NAME]).toBe(toggle.set);

    (globalWindow()[GLOBAL_NAME] as (enabled: boolean) => void)(true);
    expect(toggle.isEnabled()).toBe(true);
  });

  it('keeps separate state per toggle', () => {
    const first = createDebugToggle(GLOBAL_NAME);
    const second = createDebugToggle(`${GLOBAL_NAME}2`);
    first.set(true);
    expect(second.isEnabled()).toBe(false);
    delete globalWindow()[`${GLOBAL_NAME}2`];
  });
});
