import {
  canvasEntitiesRemovedToast,
  canvasEntityRemovedToast,
} from '@/features/Core/utils/toastMessages';

interface FinalizeCanvasElementRemovalOptions {
  clearHover: () => void;
  setSelectedNodeIds: (ids: string[]) => void;
  pickedCount: number;
  /** When a single named entity was removed; omitted for edges or multi-remove. */
  singleEntityName?: string;
}

/** Clear selection UI and toast after a canvas remove gesture. */
export const finalizeCanvasElementRemoval = ({
  clearHover,
  setSelectedNodeIds,
  pickedCount,
  singleEntityName,
}: FinalizeCanvasElementRemovalOptions) => {
  clearHover();
  setSelectedNodeIds([]);
  if (pickedCount === 1 && singleEntityName !== undefined) {
    canvasEntityRemovedToast(singleEntityName);
    return;
  }
  if (pickedCount > 0) canvasEntitiesRemovedToast(pickedCount);
};
