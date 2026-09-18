import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useUpdateProjects, useUserProjects, useUserQueries,
} from '@/features/Projects/hooks/customHooks';
import {
  errorToast, projectUpdatedToast,
} from '@/features/Core/utils/toastMessages';
import {
  getProjectPkDiffAction,
  optimisticUpdateProject,
  revertProjectUpdate,
} from '@/features/Projects/utils/projectQueryCacheHelpers';

export type UpdateProjectOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  noToast?: boolean;
};

export type HandleUpdateProject = (
  id: number | string,
  newName?: string,
  newQids?: string[],
  options?: UpdateProjectOptions,
) => void;

const toastProjectUpdate = (
  projectTitle: string,
  action: 'add' | 'remove' | undefined,
  titles: string | undefined,
) => {
  if (action) projectUpdatedToast(projectTitle, titles, action);
  else projectUpdatedToast(projectTitle);
};

/** Project update (rename / membership) with optimistic cache writes. */
export const useEditProjectHandlers = () => {
  const queryClient = useQueryClient();
  const { data: projects = [] } = useUserProjects();
  const { data: queries = [] } = useUserQueries();
  const updateProjectsMutation = useUpdateProjects();

  const handleUpdateProject = useCallback<HandleUpdateProject>((
    id,
    newName,
    newQids,
    options = {},
  ) => {
    const { onSuccess, onError, noToast = false } = options;
    const projectToUpdate = projects.find(p => p.id === parseInt(id.toString(), 10));
    if (!projectToUpdate) {
      console.error('Project not found:', id);
      return;
    }

    const projectTitle = newName || projectToUpdate.data.title;
    const nextPks = newQids || projectToUpdate.data.pks;
    const { action, titles } = getProjectPkDiffAction(projectToUpdate.data.pks, newQids, queries);
    optimisticUpdateProject(queryClient, projectToUpdate.id, projectTitle, nextPks);

    updateProjectsMutation.mutate(
      [{ id: projectToUpdate.id, title: projectTitle, pks: nextPks }],
      {
        onSuccess: () => {
          if (!noToast) toastProjectUpdate(projectTitle, action, titles);
          onSuccess?.();
        },
        onError: (error) => {
          console.error('Failed to update project:', error);
          if (!noToast) errorToast('Failed to update project');
          revertProjectUpdate(queryClient, projectToUpdate);
          onError?.(error);
        },
      },
    );
  }, [projects, queries, queryClient, updateProjectsMutation]);

  return { handleUpdateProject };
};
