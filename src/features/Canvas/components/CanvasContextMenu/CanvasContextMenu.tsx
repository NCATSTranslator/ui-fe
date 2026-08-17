import { FC, createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { selectActiveCanvas, addCanvas, getNextCanvasLabel, selectCanvases } from '@/features/Canvas/slices/canvasSlice';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { createCanvas as createCanvasApi } from '@/features/Canvas/utils/canvasApi';
import { addResultEntityToCanvas } from '@/features/Canvas/utils/addResultEntityToCanvas';
import { canvasSaveErrorToast } from '@/features/Core/utils/toastMessages';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import type { Canvas, CanvasLayout } from '@/features/Canvas/types/canvas';
import type { Path } from '@/features/ResultList/types/results';
import styles from './CanvasContextMenu.module.scss';

type MenuTarget = {
  type: 'node' | 'edge' | 'path';
  id: string;
  pk: string;
  position: { x: number; y: number };
  path?: Path;
};

type CanvasContextMenuContextValue = {
  openMenu: (type: 'node' | 'edge' | 'path', id: string, pk: string, position: { x: number; y: number }, path?: Path) => void;
};

const CanvasContextMenuContext = createContext<CanvasContextMenuContextValue | null>(null);

const getButtonLabel = (type: MenuTarget['type'], hasCanvas: boolean): string => {
  if (type === 'path') return hasCanvas ? 'Add path to graph' : 'New canvas + add path to graph';
  return hasCanvas ? `Add ${type} to canvas` : `New canvas + add ${type}`;
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
  const canvases = useSelector(selectCanvases);
  const resultSet = useSelector(getResultSetById(target.pk));
  const menuRef = useRef<HTMLDivElement>(null);

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
    const label = getNextCanvasLabel(canvases);
    const layout: CanvasLayout = 'horizontal';
    try {
      const meta = await createCanvasApi(label, layout);
      const canvas: Canvas = {
        id: meta.id,
        label: meta.label,
        layout: meta.layout,
        nodes: {},
        edges: {},
        tags: meta.data.tags,
        queryRef: meta.data.query_ref,
        resultRef: meta.data.result_ref,
        annotations: [],
        timeCreated: meta.time_created,
        timeUpdated: meta.time_updated,
        graphLoaded: true,
      };
      dispatch(addCanvas(canvas));
      queryClient.invalidateQueries({ queryKey: ['userCanvases'] });
      return canvas;
    } catch {
      canvasSaveErrorToast();
      return null;
    }
  }, [activeCanvas, canvases, dispatch, queryClient]);

  const handleAdd = useCallback(async () => {
    if (!resultSet) return;
    const canvas = await ensureCanvas();
    if (!canvas) return;

    await addResultEntityToCanvas({
      resultSet,
      target: { type: target.type, id: target.id, pk: target.pk, path: target.path },
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
        {getButtonLabel(target.type, hasCanvas)}
      </button>
    </div>,
    document.body,
  );
};

export const CanvasContextMenuProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [target, setTarget] = useState<MenuTarget | null>(null);

  const openMenu = useCallback((type: 'node' | 'edge' | 'path', id: string, pk: string, position: { x: number; y: number }, path?: Path) => {
    setTarget({ type, id, pk, position, path });
  }, []);

  const closeMenu = useCallback(() => setTarget(null), []);

  return (
    <CanvasContextMenuContext.Provider value={{ openMenu }}>
      {children}
      {target && <ContextMenuPopup target={target} onClose={closeMenu} />}
    </CanvasContextMenuContext.Provider>
  );
};
