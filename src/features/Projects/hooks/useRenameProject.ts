import { useState, useRef, useCallback, useEffect, FormEvent, useMemo, RefObject } from "react";
import { Project } from "@/features/Projects/types/projects";
import { useEditProjectHandlers } from "@/features/Projects/utils/editUpdateFunctions";
import { getBlankProjectTitle } from "@/features/Projects/utils/utilities";

interface UseRenameProjectOptions {
  project?: Project;
  allProjects?: Project[];
  startRenaming?: boolean;
  onRename?: (project: Project) => void;
}

interface UseRenameProjectReturn {
  // State
  isRenaming: boolean;
  localTitle: string;
  
  // Actions
  startRenaming: () => void;
  cancelRenaming: () => void;
  completeRenaming: (title?: string) => void;
  handleTitleChange: (value: string) => void;
  handleFormSubmit: (e: FormEvent<HTMLFormElement>) => void;
  handleOutsideClick: () => void;
  setIsRenaming: (isRenaming: boolean) => void;
  
  // Refs for input management
  textInputRef: RefObject<HTMLInputElement | null>;
}

/**
 * Custom hook for managing project renaming functionality
 * Provides a unified interface for renaming projects across different components
 * 
 * @param options - Configuration options
 * @param options.project - The project to rename (optional - hook will handle undefined gracefully)
 * @param options.allProjects - Optional array of all projects to calculate next "New Project X" title
 * @param options.startRenaming - Whether to start in renaming mode
 * @param options.onRename - Callback when rename completes
 * @returns Object containing state, actions, and refs for renaming functionality
 */
export const useRenameProject = ({
  project,
  allProjects,
  startRenaming: initialRenaming = false,
  onRename
}: UseRenameProjectOptions): UseRenameProjectReturn => {
  const [isRenaming, setIsRenaming] = useState(initialRenaming);
  const [localTitle, setLocalTitle] = useState(project?.data.title || '');
  const textInputRef = useRef<HTMLInputElement>(null);
  const { handleUpdateProject } = useEditProjectHandlers();
  
  // Calculate blank project title
  // Priority: calculated from allProjects > default
  const defaultBlankTitle = useMemo(() => {
    if (allProjects) return getBlankProjectTitle(allProjects);
    return 'Untitled Project';
  }, [allProjects]);
  
  // Keep local title in sync with project title when not renaming
  useEffect(() => {
    if (!isRenaming && project) {
      setLocalTitle(project.data.title);
    }
  }, [project?.data.title, isRenaming, project]);

  // Focus and select text when entering rename mode
  useEffect(() => {
    if (isRenaming && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isRenaming]);

  /**
   * Start the renaming process
   */
  const startRenamingAction = useCallback(() => {
    setIsRenaming(true);
  }, []);

  /**
   * Cancel renaming and revert to original title
   */
  const cancelRenaming = useCallback(() => {
    if (project)
      setLocalTitle(project.data.title);

    setIsRenaming(false);
  }, [project]);

  /**
   * Complete the renaming process and update the project
   * @param title - Optional title to use, defaults to localTitle
   */
  const completeRenaming = useCallback((title?: string) => {
    if (!project) {
      setIsRenaming(false);
      return;
    }
    
    const titleToUse = title !== undefined ? title : localTitle;
    const finalTitle = titleToUse.trim().length > 0 ? titleToUse.trim() : defaultBlankTitle;

    // If the final title is the same as the current title, don't update
    if(finalTitle === project.data.title) {
      setIsRenaming(false);
      return;
    }
    
    handleUpdateProject(project.id, finalTitle);
    onRename?.(project);
    setIsRenaming(false);
  }, [localTitle, defaultBlankTitle, project, handleUpdateProject, onRename]);

  /**
   * Handle title input changes
   */
  const handleTitleChange = useCallback((value: string) => {
    setLocalTitle(value);
  }, []);

  /**
   * Handle form submission (Enter key)
   */
  const handleFormSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    completeRenaming();
  }, [completeRenaming]);

  /**
   * Handle clicks outside the rename input
   * Completes renaming with current value or blank title if empty
   */
  const handleOutsideClick = useCallback(() => {
    if (isRenaming)
      completeRenaming();
  }, [isRenaming, completeRenaming]);

  return {
    // State
    isRenaming,
    localTitle,
    
    // Actions
    startRenaming: startRenamingAction,
    cancelRenaming,
    completeRenaming,
    handleTitleChange,
    handleFormSubmit,
    handleOutsideClick,
    setIsRenaming,
    
    // Refs
    textInputRef
  };
};

