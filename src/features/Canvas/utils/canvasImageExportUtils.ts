import { toBlob } from 'html-to-image';
import { triggerBlobDownload } from '@/features/Core/utils/fileDownloadUtils';
import { buildCanvasExportFilename } from '@/features/Canvas/utils/canvasExportUtils';

/** Graph-space padding added around the content bounds in the exported image. */
const EXPORT_PADDING = 40;
/** Upper bound on either output dimension, before the device pixel ratio multiplier. */
const MAX_EXPORT_DIMENSION = 4000;
/** Rendered at 2x so node labels stay legible when the image is zoomed. */
const EXPORT_PIXEL_RATIO = 2;
const EXPORT_BACKGROUND = '#ffffff';

/**
 * Interactive affordances that belong to the editor, not to the picture of the
 * graph: node chrome buttons, annotation delete buttons, connection handles and
 * the React Flow attribution.
 */
const EXCLUDED_SELECTOR = [
  'button',
  '.react-flow__handle',
  '.react-flow__attribution',
].join(',');

/**
 * html-to-image deep-clones any <svg> subtree verbatim and copies computed
 * styles only down to the <svg> element itself, so descendants lose every rule
 * that came from a stylesheet. Edge paths take their stroke from a class, so
 * without this they clone as unpainted geometry and disappear from the image.
 */
const SVG_PRESENTATION_PROPERTIES = [
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'color',
  'opacity',
  'visibility',
  'display',
  'marker-start',
  'marker-mid',
  'marker-end',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'text-anchor',
  'dominant-baseline',
];

/**
 * Writes each SVG descendant's computed presentation styles onto the element
 * itself and returns a function restoring the previous `style` attributes. The
 * written values match what is already on screen, so the live graph does not
 * change while the capture runs.
 */
export const inlineSVGPresentationStyles = (root: HTMLElement): (() => void) => {
  const restorers: (() => void)[] = [];

  for (const element of root.querySelectorAll<SVGElement>('svg *')) {
    const style = element.style;
    if (!style) continue;

    const previous = element.getAttribute('style');
    const computed = window.getComputedStyle(element);

    for (const property of SVG_PRESENTATION_PROPERTIES) {
      const value = computed.getPropertyValue(property);
      if (value) style.setProperty(property, value);
    }

    restorers.push(() => {
      if (previous === null) element.removeAttribute('style');
      else element.setAttribute('style', previous);
    });
  }

  return () => {
    for (const restore of restorers) restore();
  };
};

export type GraphBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const TRANSLATE_PATTERN = /translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/;

/**
 * React Flow positions each node with an inline `translate(Xpx, Ypx)` in
 * graph space, so the node elements themselves carry the layout we need. This
 * avoids reaching for a React Flow instance, which translator-graph-view keeps
 * to itself.
 */
export const getNodeGraphRect = (node: HTMLElement): GraphBounds | null => {
  const match = TRANSLATE_PATTERN.exec(node.style.transform);
  if (!match) return null;
  return {
    x: parseFloat(match[1]),
    y: parseFloat(match[2]),
    width: node.offsetWidth,
    height: node.offsetHeight,
  };
};

/**
 * Union of every node's graph-space rect. Returns null when the viewport holds
 * no positioned nodes, which is the "nothing to export" case.
 */
export const getGraphContentBounds = (viewport: HTMLElement): GraphBounds | null => {
  const nodes = viewport.querySelectorAll<HTMLElement>('.react-flow__node');

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const rect = getNodeGraphRect(node);
    if (!rect) continue;
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  if (minX === Infinity) return null;

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

type ExportFrame = {
  width: number;
  height: number;
  scale: number;
  translateX: number;
  translateY: number;
};

/**
 * Frames the padded content bounds at 1:1, scaling down only when that would
 * exceed the maximum output dimension.
 */
export const getExportFrame = (bounds: GraphBounds): ExportFrame => {
  const paddedWidth = bounds.width + EXPORT_PADDING * 2;
  const paddedHeight = bounds.height + EXPORT_PADDING * 2;
  const scale = Math.min(1, MAX_EXPORT_DIMENSION / Math.max(paddedWidth, paddedHeight));

  return {
    width: Math.ceil(paddedWidth * scale),
    height: Math.ceil(paddedHeight * scale),
    scale,
    translateX: (EXPORT_PADDING - bounds.x) * scale,
    translateY: (EXPORT_PADDING - bounds.y) * scale,
  };
};

/**
 * Rasterizes the whole graph, not just what is on screen: the capture target is
 * the React Flow viewport, and we substitute its live pan/zoom transform for one
 * that frames the full content bounds.
 */
export const exportCanvasToPNGFile = async (graphArea: HTMLElement, label: string): Promise<void> => {
  const viewport = graphArea.querySelector<HTMLElement>('.react-flow__viewport');
  if (!viewport) throw new Error('Canvas graph viewport not found');

  const bounds = getGraphContentBounds(viewport);
  if (!bounds) throw new Error('Canvas has no graph content to export');

  const frame = getExportFrame(bounds);
  const restoreSVGStyles = inlineSVGPresentationStyles(viewport);

  let blob: Blob | null;
  try {
    blob = await toBlob(viewport, {
      width: frame.width,
      height: frame.height,
      pixelRatio: EXPORT_PIXEL_RATIO,
      backgroundColor: EXPORT_BACKGROUND,
      // The rasterized SVG cannot reach the document's webfont, so html-to-image
      // inlines the @font-face rules itself. A failed fetch is logged, not thrown,
      // and the text falls back to the generic sans stack.
      filter: (node) => !(node instanceof Element && node.matches(EXCLUDED_SELECTOR)),
      style: {
        transform: `translate(${frame.translateX}px, ${frame.translateY}px) scale(${frame.scale})`,
        transformOrigin: '0 0',
      },
    });
  } finally {
    restoreSVGStyles();
  }

  if (!blob) throw new Error('Canvas image export produced no data');

  triggerBlobDownload(blob, buildCanvasExportFilename(label, 'png'));
};
