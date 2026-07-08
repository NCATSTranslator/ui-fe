import { useState, useCallback } from 'react';
import type { InspectorBreadcrumb, InspectorLevel, InspectorViewData } from '@/features/Canvas/types/canvas';

const useCanvasInspector = () => {
  const [stack, setStack] = useState<InspectorBreadcrumb[]>([]);

  const pushView = useCallback((level: InspectorLevel, label: string, id: string, data: InspectorViewData) => {
    setStack(prev => [...prev, { level, label, id, data }]);
  }, []);

  const openView = useCallback((level: InspectorLevel, label: string, id: string, data: InspectorViewData) => {
    setStack([{ level, label, id, data }]);
  }, []);

  const popTo = useCallback((index: number) => {
    setStack(prev => prev.slice(0, index + 1));
  }, []);

  const goBack = useCallback(() => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback(() => {
    setStack([]);
  }, []);

  const currentView = stack.length > 0 ? stack[stack.length - 1] : null;
  const isOpen = stack.length > 0;

  return {
    stack,
    currentView,
    isOpen,
    pushView,
    openView,
    popTo,
    goBack,
    reset,
  };
};

export type CanvasInspectorState = ReturnType<typeof useCanvasInspector>;

export default useCanvasInspector;
