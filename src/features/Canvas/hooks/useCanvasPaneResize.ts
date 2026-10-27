import {
  KeyboardEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MAIN_CONTENT_ELEMENT_ID, MAIN_SCROLL_ELEMENT_ID } from '@/features/Navigation/utils/navigationUtils';
import {
  CANVAS_PANE_MIN_HEIGHT,
  clampPaneHeight,
  resolvePaneHeight,
} from '@/features/Canvas/utils/canvasPaneHeight';

const KEYBOARD_STEP = 16;
const KEYBOARD_LARGE_STEP = 64;

const getLayoutElements = () => {
  const main = document.getElementById(MAIN_CONTENT_ELEMENT_ID);
  const header = document.getElementById(MAIN_SCROLL_ELEMENT_ID)?.querySelector(':scope > header');
  return { main, header: header instanceof HTMLElement ? header : null };
};

const measureAvailableHeight = () => {
  const { main, header } = getLayoutElements();
  return main ? main.clientHeight - (header?.offsetHeight ?? 0) : 0;
};

/**
 * Height the pane may grow to: the main column minus the sticky page header,
 * so a maximized pane stops right under the header instead of covering it.
 * Measured synchronously on mount, so a pane remounted for another canvas
 * paints at its saved height instead of flashing the CSS fallback first, then
 * re-measured whenever either element changes size. The observer delivers an
 * initial observation on observe(), so the effect does not measure again.
 */
export const useCanvasPaneAvailableHeight = (): number => {
  const [availableHeight, setAvailableHeight] = useState(measureAvailableHeight);

  useLayoutEffect(() => {
    const { main, header } = getLayoutElements();
    if (!main || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => setAvailableHeight(measureAvailableHeight()));
    observer.observe(main);
    if (header) observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return availableHeight;
};

interface UseCanvasPaneResizeArgs {
  /** False while the handle is not rendered, so an interrupted gesture is discarded. */
  active: boolean;
  paneMaximized: boolean;
  paneHeight: number | null;
  availableHeight: number;
  onCommit: (height: number) => void;
}

interface GestureState {
  /** Pointer y at drag start; unused for keyboard gestures. */
  startY: number;
  startHeight: number;
  /** Latest clamped height, mirrored from state so release can commit it synchronously. */
  currentHeight: number;
}

/**
 * Pointer and keyboard resizing for the pane's top edge. Both input methods
 * track the height through local state for the duration of the gesture and
 * commit to the store once, on pointer release or key release, so the graph is
 * not re-rendered (and no analytics event fires) for every pixel or key repeat.
 * A gesture that ends where it started commits nothing.
 */
export const useCanvasPaneResize = ({
  active,
  paneMaximized,
  paneHeight,
  availableHeight,
  onCommit,
}: UseCanvasPaneResizeArgs) => {
  const [gestureHeight, setGestureHeight] = useState<number | null>(null);
  const gestureRef = useRef<GestureState | null>(null);

  const height = resolvePaneHeight({ dragHeight: gestureHeight, paneMaximized, paneHeight, availableHeight });

  // The handlers read the resolved height through a ref so they stay stable
  // for the whole gesture instead of being rebuilt on every height update.
  const heightRef = useRef(height);
  heightRef.current = height;

  useEffect(() => {
    if (active) return;
    gestureRef.current = null;
    setGestureHeight(null);
  }, [active]);

  const beginGesture = useCallback((startY: number): GestureState | null => {
    if (gestureRef.current) return gestureRef.current;
    const startHeight = heightRef.current;
    if (startHeight === null) return null;
    gestureRef.current = { startY, startHeight, currentHeight: startHeight };
    setGestureHeight(startHeight);
    return gestureRef.current;
  }, []);

  const endGesture = useCallback(() => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    gestureRef.current = null;
    setGestureHeight(null);
    if (gesture.currentHeight !== gesture.startHeight) onCommit(gesture.currentHeight);
  }, [onCommit]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !beginGesture(event.clientY)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [beginGesture]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    gesture.currentHeight = clampPaneHeight(gesture.startHeight + gesture.startY - event.clientY, availableHeight);
    setGestureHeight(gesture.currentHeight);
  }, [availableHeight]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (!isResizeKey(event.key)) return;
    event.preventDefault();
    const gesture = beginGesture(0);
    if (!gesture) return;
    const step = event.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
    gesture.currentHeight = clampPaneHeight(
      keyboardTargetHeight(event.key, gesture.currentHeight, step, availableHeight),
      availableHeight,
    );
    setGestureHeight(gesture.currentHeight);
  }, [availableHeight, beginGesture]);

  const onKeyUp = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (isResizeKey(event.key)) endGesture();
  }, [endGesture]);

  const handleProps = useMemo(() => ({
    onPointerDown,
    onPointerMove,
    onPointerUp: endGesture,
    onPointerCancel: endGesture,
    onKeyDown,
    onKeyUp,
    onBlur: endGesture,
    'aria-valuemin': CANVAS_PANE_MIN_HEIGHT,
    'aria-valuemax': availableHeight > 0 ? availableHeight : undefined,
    'aria-valuenow': height ?? undefined,
  }), [availableHeight, endGesture, height, onKeyDown, onKeyUp, onPointerDown, onPointerMove]);

  return { height, dragging: gestureHeight !== null, handleProps };
};

type ResizeKey = 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';

const isResizeKey = (key: string): key is ResizeKey =>
  key === 'ArrowUp' || key === 'ArrowDown' || key === 'Home' || key === 'End';

const keyboardTargetHeight = (
  key: ResizeKey,
  height: number,
  step: number,
  availableHeight: number,
): number => {
  switch (key) {
    case 'ArrowUp': return height + step;
    case 'ArrowDown': return height - step;
    case 'Home': return availableHeight;
    case 'End': return CANVAS_PANE_MIN_HEIGHT;
  }
};
