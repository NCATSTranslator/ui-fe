import { describe, expect, it } from 'vitest';
import {
  CANVAS_PANE_MIN_HEIGHT,
  clampPaneHeight,
  defaultPaneHeight,
  resolvePaneHeight,
} from '@/features/Canvas/utils/canvasPaneHeight';

describe('clampPaneHeight', () => {
  it('raises heights below the minimum', () => {
    expect(clampPaneHeight(10, 800)).toBe(CANVAS_PANE_MIN_HEIGHT);
  });

  it('caps heights at the available area', () => {
    expect(clampPaneHeight(5000, 800)).toBe(800);
  });

  it('only enforces the minimum when the area is unmeasured', () => {
    expect(clampPaneHeight(5000, 0)).toBe(5000);
    expect(clampPaneHeight(10, 0)).toBe(CANVAS_PANE_MIN_HEIGHT);
  });

  it('lets the available area win when it is smaller than the minimum', () => {
    expect(clampPaneHeight(300, 120)).toBe(120);
  });
});

describe('resolvePaneHeight', () => {
  const base = { dragHeight: null, paneMaximized: false, paneHeight: null, availableHeight: 800 };

  it('is null before the area is measured', () => {
    expect(resolvePaneHeight({ ...base, availableHeight: 0 })).toBeNull();
  });

  it('defaults to half the available area', () => {
    expect(resolvePaneHeight(base)).toBe(defaultPaneHeight(800));
  });

  it('uses the committed height, clamped', () => {
    expect(resolvePaneHeight({ ...base, paneHeight: 300 })).toBe(300);
    expect(resolvePaneHeight({ ...base, paneHeight: 2000 })).toBe(800);
  });

  it('fills the available area when maximized', () => {
    expect(resolvePaneHeight({ ...base, paneMaximized: true, paneHeight: 300 })).toBe(800);
  });

  it('prefers an in-progress drag, even over maximized', () => {
    expect(resolvePaneHeight({ ...base, paneMaximized: true, dragHeight: 420 })).toBe(420);
  });
});
