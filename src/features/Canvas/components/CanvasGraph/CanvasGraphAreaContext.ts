import { createContext, useContext, type RefObject } from 'react';

/**
 * The graph area element, shared so descendants of CanvasGraph (the settings
 * menu, via useCanvasSettingsActions) can rasterize the rendered graph.
 * translator-graph-view exposes no imperative handle, so the DOM node is the
 * only way in.
 */
export const CanvasGraphAreaContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

export const useCanvasGraphAreaRef = () => useContext(CanvasGraphAreaContext);
