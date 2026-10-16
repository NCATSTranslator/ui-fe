import type { Canvas } from '@/features/Canvas/types/canvas';

export const canvasEntityParams = (canvas: Canvas, entityId: number): Record<string, string> => ({
  canvas: String(canvas.id),
  entityId: String(entityId),
});
