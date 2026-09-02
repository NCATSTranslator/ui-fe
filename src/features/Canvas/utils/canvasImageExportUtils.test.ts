import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  getGraphContentBounds,
  getExportFrame,
  exportCanvasToPNGFile,
  inlineSVGPresentationStyles,
} from './canvasImageExportUtils';
import { buildCanvasExportFilename } from './canvasExportUtils';

vi.mock('html-to-image', () => ({ toBlob: vi.fn() }));
vi.mock('@/features/Core/utils/fileDownloadUtils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/Core/utils/fileDownloadUtils')>()),
  triggerBlobDownload: vi.fn(),
}));

import { toBlob } from 'html-to-image';
import { triggerBlobDownload } from '@/features/Core/utils/fileDownloadUtils';

/** jsdom reports 0 for offsetWidth/offsetHeight, so the sizes are stubbed per element. */
const addNode = (viewport: HTMLElement, x: number, y: number, width = 120, height = 32) => {
  const node = document.createElement('div');
  node.className = 'react-flow__node';
  node.style.transform = `translate(${x}px, ${y}px)`;
  Object.defineProperty(node, 'offsetWidth', { value: width });
  Object.defineProperty(node, 'offsetHeight', { value: height });
  viewport.appendChild(node);
  return node;
};

const buildGraphArea = () => {
  const graphArea = document.createElement('div');
  const viewport = document.createElement('div');
  viewport.className = 'react-flow__viewport';
  graphArea.appendChild(viewport);
  return { graphArea, viewport };
};

describe('getGraphContentBounds', () => {
  it('returns the union of the node rects in graph space', () => {
    const { viewport } = buildGraphArea();
    addNode(viewport, 0, 0);
    addNode(viewport, 200, 100);

    expect(getGraphContentBounds(viewport)).toEqual({ x: 0, y: 0, width: 320, height: 132 });
  });

  it('handles negative positions', () => {
    const { viewport } = buildGraphArea();
    addNode(viewport, -50, -20);
    addNode(viewport, 50, 20);

    expect(getGraphContentBounds(viewport)).toEqual({ x: -50, y: -20, width: 220, height: 72 });
  });

  it('ignores nodes without a translate transform', () => {
    const { viewport } = buildGraphArea();
    addNode(viewport, 10, 10);
    const unpositioned = addNode(viewport, 0, 0);
    unpositioned.style.transform = '';

    expect(getGraphContentBounds(viewport)).toEqual({ x: 10, y: 10, width: 120, height: 32 });
  });

  it('returns null when there are no positioned nodes', () => {
    const { viewport } = buildGraphArea();
    expect(getGraphContentBounds(viewport)).toBeNull();
  });
});

/** Mirrors the class-based edge styling that html-to-image drops from SVG subtrees. */
const addEdge = (viewport: HTMLElement) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('react-flow__edges');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.classList.add('react-flow__edge-path');
  svg.appendChild(path);
  viewport.appendChild(svg);
  return path;
};

describe('inlineSVGPresentationStyles', () => {
  it('writes computed paint onto SVG descendants and restores them afterwards', () => {
    const { viewport } = buildGraphArea();
    const path = addEdge(viewport);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (property: string) =>
        ({ stroke: 'rgb(136, 136, 136)', 'stroke-width': '2px', fill: 'none' })[property] ?? '',
    } as unknown as CSSStyleDeclaration);

    const restore = inlineSVGPresentationStyles(viewport);

    expect(path.style.stroke).toBe('rgb(136, 136, 136)');
    expect(path.style.strokeWidth).toBe('2px');
    expect(path.style.fill).toBe('none');

    restore();
    expect(path.getAttribute('style')).toBeNull();
  });

  it('restores a pre-existing style attribute rather than clearing it', () => {
    const { viewport } = buildGraphArea();
    const path = addEdge(viewport);
    path.setAttribute('style', 'opacity: 0.3;');

    const restore = inlineSVGPresentationStyles(viewport);
    restore();

    expect(path.getAttribute('style')).toBe('opacity: 0.3;');
  });
});

describe('getExportFrame', () => {
  it('pads the bounds and frames them at 1:1 when they fit', () => {
    const frame = getExportFrame({ x: 10, y: 20, width: 100, height: 50 });

    expect(frame.scale).toBe(1);
    expect(frame.width).toBe(180);
    expect(frame.height).toBe(130);
    expect(frame.translateX).toBe(30);
    expect(frame.translateY).toBe(20);
  });

  it('scales down when the padded bounds exceed the maximum dimension', () => {
    const frame = getExportFrame({ x: 0, y: 0, width: 7920, height: 1000 });

    expect(frame.scale).toBe(0.5);
    expect(frame.width).toBe(4000);
    expect(frame.height).toBe(540);
  });
});

describe('buildCanvasExportFilename', () => {
  it('sanitizes the label and stamps the date with the given extension', () => {
    const date = new Date('2026-09-02T12:00:00Z');
    expect(buildCanvasExportFilename('My Canvas!', 'png', date))
      .toBe('My-Canvas_canvas_2026-09-02.png');
    expect(buildCanvasExportFilename('My Canvas!', 'csv', date))
      .toBe('My-Canvas_canvas_2026-09-02.csv');
  });
});

describe('exportCanvasToPNGFile', () => {
  const mockedToBlob = vi.mocked(toBlob);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rasterizes the viewport with a transform framing the whole graph', async () => {
    const { graphArea, viewport } = buildGraphArea();
    addNode(viewport, 100, 100);
    const blob = new Blob(['png']);
    mockedToBlob.mockResolvedValue(blob);

    await exportCanvasToPNGFile(graphArea, 'Test Canvas');

    expect(mockedToBlob).toHaveBeenCalledTimes(1);
    const [target, options] = mockedToBlob.mock.calls[0];
    expect(target).toBe(viewport);
    expect(options?.width).toBe(200);
    expect(options?.height).toBe(112);
    expect(options?.style?.transform).toBe('translate(-60px, -60px) scale(1)');
    expect(vi.mocked(triggerBlobDownload)).toHaveBeenCalledWith(blob, expect.stringContaining('Test-Canvas_canvas_'));
  });

  it('inlines SVG paint for the capture and restores the DOM afterwards', async () => {
    const { graphArea, viewport } = buildGraphArea();
    addNode(viewport, 0, 0);
    const path = addEdge(viewport);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (property: string) => (property === 'stroke' ? 'rgb(136, 136, 136)' : ''),
    } as unknown as CSSStyleDeclaration);

    let strokeDuringCapture: string | undefined;
    mockedToBlob.mockImplementation(async () => {
      strokeDuringCapture = path.style.stroke;
      return new Blob(['png']);
    });

    await exportCanvasToPNGFile(graphArea, 'Test Canvas');

    expect(strokeDuringCapture).toBe('rgb(136, 136, 136)');
    expect(path.getAttribute('style')).toBeNull();
  });

  it('restores SVG paint even when the capture throws', async () => {
    const { graphArea, viewport } = buildGraphArea();
    addNode(viewport, 0, 0);
    const path = addEdge(viewport);
    mockedToBlob.mockRejectedValue(new Error('capture failed'));

    await expect(exportCanvasToPNGFile(graphArea, 'Test Canvas')).rejects.toThrow('capture failed');
    expect(path.getAttribute('style')).toBeNull();
  });

  it('excludes buttons and connection handles from the image', async () => {
    const { graphArea, viewport } = buildGraphArea();
    addNode(viewport, 0, 0);
    mockedToBlob.mockResolvedValue(new Blob(['png']));

    await exportCanvasToPNGFile(graphArea, 'Test Canvas');

    const filter = mockedToBlob.mock.calls[0][1]?.filter;
    const button = document.createElement('button');
    const handle = document.createElement('div');
    handle.className = 'react-flow__handle';
    const label = document.createElement('span');

    expect(filter?.(button)).toBe(false);
    expect(filter?.(handle)).toBe(false);
    expect(filter?.(label)).toBe(true);
  });

  it('throws when the canvas has no graph content', async () => {
    const { graphArea } = buildGraphArea();

    await expect(exportCanvasToPNGFile(graphArea, 'Test Canvas')).rejects.toThrow('no graph content');
    expect(mockedToBlob).not.toHaveBeenCalled();
  });

  it('throws when the viewport is missing', async () => {
    const graphArea = document.createElement('div');

    await expect(exportCanvasToPNGFile(graphArea, 'Test Canvas')).rejects.toThrow('viewport not found');
  });
});
