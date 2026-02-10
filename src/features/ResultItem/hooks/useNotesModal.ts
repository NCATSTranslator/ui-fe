import { useState, useCallback } from 'react';

export interface UseNotesModalReturn {
  isOpen: boolean;
  noteLabel: string;
  currentBookmarkID: string | null;
  openNotes: (label: string, bookmarkId: string) => void;
  closeNotes: () => void;
}

/**
 * Hook to manage notes modal state at the parent level (ResultList, UserSaves).
 * Encapsulates the modal open/close state along with the note label and bookmark ID.
 */
export const useNotesModal = (): UseNotesModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [noteLabel, setNoteLabel] = useState("");
  const [currentBookmarkID, setCurrentBookmarkID] = useState<string | null>(null);

  const openNotes = useCallback((label: string, bookmarkId: string) => {
    setNoteLabel(label);
    setCurrentBookmarkID(bookmarkId);
    setIsOpen(true);
  }, []);

  const closeNotes = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    noteLabel,
    currentBookmarkID,
    openNotes,
    closeNotes,
  };
};
