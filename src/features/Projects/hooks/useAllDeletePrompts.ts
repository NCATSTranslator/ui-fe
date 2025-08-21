import { useShouldShowDeletePrompt } from './customHooks';

/**
 * Hook to manage all delete prompts used in ProjectListInner
 * Consolidates the 6 different delete prompt states into a single hook
 * @returns {Object} - An object containing all the delete prompt states
 */
export const useAllDeletePrompts = () => {
  const deleteProjects = useShouldShowDeletePrompt('hideDeleteProjectsPrompt', true);
  const deleteQueries = useShouldShowDeletePrompt('hideDeleteQueriesPrompt', true);
  const permanentDeleteProject = useShouldShowDeletePrompt('hidePermanentDeleteProjectPrompt', true);
  const permanentDeleteQuery = useShouldShowDeletePrompt('hidePermanentDeleteQueryPrompt', true);
  const permanentDeleteSelected = useShouldShowDeletePrompt('hidePermanentDeleteSelectedPrompt', true);
  const emptyTrash = useShouldShowDeletePrompt('hideEmptyTrashPrompt', true);

  return {
    deleteProjects,
    deleteQueries,
    permanentDeleteProject,
    permanentDeleteQuery,
    permanentDeleteSelected,
    emptyTrash
  };
};
