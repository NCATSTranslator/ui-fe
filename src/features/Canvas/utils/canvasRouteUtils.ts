import type { Canvas } from '@/features/Canvas/types/canvas';

export const canvasEntityParams = (canvas: Canvas, dataId: number): Record<string, string> => ({
  canvas: String(canvas.id),
  dataId: String(dataId),
});
