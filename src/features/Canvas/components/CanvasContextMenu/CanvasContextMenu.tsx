import { FC, createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { selectActiveCanvas } from '@/features/Canvas/slices/canvasSlice';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { addResultEntityToCanvas, type ResultEntityTarget } from '@/features/Canvas/utils/addResultEntityToCanvas';
import { getDistinctPredicateEdgeIDs } from '@/features/Core/utils/resultHelpers';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import type { Canvas } from '@/features/Canvas/types/canvas';
import styles from './CanvasContextMenu.module.scss';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';
import { selectCanvasEnabled } from '@/features/UserAuth/slices/userSlice';

type MenuTarget = ResultEntityTarget & {
  position: { x: number; y: number };
};

type CanvasContextMenuContextValue = {
  openMenu: (target: MenuTarget) => void;
  canvasEnabled: boolean;
};

const CanvasContextMenuContext = createContext<CanvasContextMenuContextValue | null>(null);

const ENTITY_NOUNS: Record<MenuTarget['type'], string> = {
  path: 'path',
  node: 'object',
  edge: 'relationship',
  result: 'result',
};

const getButtonLabel = (hasCanvas: boolean, noun: string): string => {
  return hasCanvas ? `Add ${noun} to canvas` : `New canvas + add ${noun}`;
};

export const useCanvasContextMenu = (): CanvasContextMenuContextValue => {
  const ctx = useContext(CanvasContextMenuContext);
  if (!ctx) throw new Error('useCanvasContextMenu must be used within CanvasContextMenuProvider');
  return ctx;
};

const ContextMenuPopup: FC<{
  target: MenuTarget;
  onClose: () => void;
}> = ({ target, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const activeCanvas = useSelector(selectActiveCanvas);
  const resultSet = useSelector(getResultSetById(target.pk));
  const menuRef = useRef<HTMLDivElement>(null);
  const { handleCreateCanvas } = useCreateCanvas();

  const entityNoun = useMemo(() => {
    if (target.type !== 'edge' || !resultSet || !target.edgeIds) {
      return ENTITY_NOUNS[target.type];
    }
    const distinctCount = getDistinctPredicateEdgeIDs(resultSet, target.edgeIds).length;
    return distinctCount > 1 ? 'relationships' : ENTITY_NOUNS.edge;
  }, [target.type, target.edgeIds, resultSet]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = () => onClose();
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const ensureCanvas = useCallback(async (): Promise<Canvas | null> => {
    if (activeCanvas) return activeCanvas;
    return handleCreateCanvas();
  }, [activeCanvas, handleCreateCanvas]);

  const handleAdd = useCallback(async () => {
    if (!resultSet) return;
    const canvas = await ensureCanvas();
    if (!canvas) return;

    await addResultEntityToCanvas({
      resultSet,
      target,
      canvas,
      dispatch,
      queryClient,
    });
    onClose();
  }, [resultSet, ensureCanvas, target, dispatch, queryClient, onClose]);

  const hasCanvas = !!activeCanvas;

  return createPortal(
    <div
      ref={menuRef}
      className={styles.contextMenu}
      // eslint-disable-next-line no-restricted-syntax
      style={{ left: `${target.position.x}px`, top: `${target.position.y}px` }}
    >
      <button type="button" onClick={handleAdd}>
        {getButtonLabel(hasCanvas, entityNoun)}
      </button>
    </div>,
    document.body,
  );
};

export const CanvasContextMenuProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [target, setTarget] = useState<MenuTarget | null>(null);
  const canvasEnabled = useSelector(selectCanvasEnabled);

  const openMenu = useCallback((nextTarget: MenuTarget) => {
    if (!canvasEnabled) return;
    setTarget(nextTarget);
  }, [canvasEnabled]);

  const closeMenu = useCallback(() => setTarget(null), []);

  useEffect(() => {
    if (!canvasEnabled) setTarget(null);
  }, [canvasEnabled]);

  return (
    <CanvasContextMenuContext.Provider value={{ openMenu, canvasEnabled }}>
      {children}
      {target && <ContextMenuPopup target={target} onClose={closeMenu} />}
    </CanvasContextMenuContext.Provider>
  );
};
