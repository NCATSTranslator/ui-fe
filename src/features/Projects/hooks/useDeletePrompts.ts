/**
 * Generic hook to manage the state of a delete prompt
 * @param {string} storageKey - The key to store the prompt state in localStorage
 * @param {boolean} defaultShow - Whether the prompt should be shown by default
 * @returns {boolean} shouldShow - Whether the prompt should be shown
 * @returns {Function} setHideDeletePrompt - Function to set the hide delete prompt
 */
export const useShouldShowDeletePrompt = (storageKey: string, defaultShow: boolean = true) => {
  const showDeletePrompt = localStorage.getItem(storageKey) === 'true' ? false : defaultShow;

  const setHideDeletePrompt = (hide: boolean) => {
    localStorage.setItem(storageKey, hide ? 'true' : 'false');
  };

  return {
    shouldShow: showDeletePrompt,
    setHideDeletePrompt
  };
};

/**
 * Generic hook to manage delete prompts for any set of prompt keys
 * @param promptKeys - Array of localStorage keys for delete prompts
 * @returns {Object} - An object containing all the delete prompt states
 */
export const useDeletePrompts = (promptKeys: string[]) => {
  const prompts: Record<string, ReturnType<typeof useShouldShowDeletePrompt>> = {};
  
  promptKeys.forEach(key => {
    prompts[key] = useShouldShowDeletePrompt(key, true);
  });

  return prompts;
};

/**
 * Hook to manage all delete prompts used in ProjectListInner
 * Uses the generic useDeletePrompts hook with all necessary prompt keys
 * @returns {Object} - An object containing all the delete prompt states
 */
export const useAllDeletePrompts = () => {
  return useDeletePrompts([
    'deleteProjects',
    'deleteQueries', 
    'permanentDeleteProject',
    'permanentDeleteQuery',
    'permanentDeleteSelected',
    'emptyTrash'
  ]);
};

/**
 * Hook to manage delete prompts used in ProjectDetailInner
 * Uses the generic useDeletePrompts hook with project-specific prompt keys
 * @returns {Object} - An object containing all the delete prompt states for project detail
 */
export const useProjectDetailDeletePrompts = () => {
  return useDeletePrompts([
    'deleteProjects'
  ]);
};
