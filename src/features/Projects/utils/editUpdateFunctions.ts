import { Dispatch, SetStateAction, useState } from 'react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { EditingItem, Project, UserQueryObject } from '@/features/Projects/types/projects.d';
import { useUpdateProjects, useUpdateQueries, useDeleteProjects, useRestoreProjects, useDeleteQueries, useRestoreQueries } from '@/features/Projects/hooks/customHooks';
import { errorToast, projectUpdatedToast, queryUpdatedToast, projectRestoredToast, projectDeletedToast, queryRestoredToast, queryDeletedToast } from './toastMessages';

export interface EditProjectQueryState {
  isEditing: boolean;
  editingItem?: { 
    id: number | string; 
    name: string; 
    type: 'project' | 'query';
    queryIds?: string[];
  };
}

export interface EditHandlers {
  handleEditProject: (project: Project) => void;
  handleEditQuery: (query: UserQueryObject) => void;
  handleUpdateItem: (id: number | string, type: 'project' | 'query', newName?: string, newQids?: string[]) => void;
  handleCancelEdit: () => void;
  handleRestoreProject: (project: Project) => void;
  handleDeleteProject: (project: Project) => void;
  handleRestoreQuery: (query: UserQueryObject) => void;
  handleDeleteQuery: (query: UserQueryObject) => void;
}

/**
 * Handles the edit state of the project or query.
 * @returns The edit state and the function to set the state.
 */
export const useEditProjectQueryState = (): [EditProjectQueryState, Dispatch<SetStateAction<EditProjectQueryState>>] => {
  const [editState, setEditState] = useState<EditProjectQueryState>({
    isEditing: false,
    editingItem: undefined
  });

  return [editState, setEditState];
};

/**
 * Handles the editing of projects and queries.
 * @param handleSetIsEditing - The function to handle setting the edit state.
 * @param projects - The projects to edit.
 * @param queries - The queries to edit.
 */
export const useEditProjectQueryHandlers = (
  handleSetIsEditing: (isEditing: boolean, editingItem?: EditingItem) => void,
  projects: Project[],
  queries: UserQueryObject[]
): EditHandlers => {
  const queryClient = useQueryClient();
  const updateProjectsMutation = useUpdateProjects();
  const updateQueriesMutation = useUpdateQueries();
  const deleteProjectsMutation = useDeleteProjects();
  const restoreProjectsMutation = useRestoreProjects();
  const deleteQueriesMutation = useDeleteQueries();
  const restoreQueriesMutation = useRestoreQueries();

  const handleEditProject = (project: Project) => {
    handleSetIsEditing(true, {
      id: project.id,
      name: project.data.title,
      type: 'project',
      queryIds: project.data.pks
    });
  };

  const handleEditQuery = (query: UserQueryObject) => {
    handleSetIsEditing(true, {
      id: query.data.qid,
      name: query.data.title || '',
      type: 'query'
    });
  };

  const handleUpdateItem = (id: number | string, type: 'project' | 'query', newName?: string, newQids?: string[]) => {
    if (type === 'project') {
      // Find the project and update it
      const projectToUpdate = projects.find(p => p.id === id);
      if (projectToUpdate) {
        const queryKey = ['userProjects'];
        // Optimistically update the React Query cache
        queryClient.setQueryData(queryKey, (oldData: Project[]) => {
          if (!oldData) return oldData;
          return oldData.map((project: Project) => 
            project.id === id 
              ? { 
                  ...project, 
                  data: {
                    title: newName || project.data.title,
                    pks: newQids || project.data.pks
                  }
                }
              : project
          );
        });

        updateProjectsMutation.mutate([{
          id: projectToUpdate.id,
          title: newName || projectToUpdate.data.title,
          pks: newQids || projectToUpdate.data.pks
        }], {
          onSuccess: () => {
            handleSetIsEditing(false);
            projectUpdatedToast();
          },
          onError: (error) => {
            console.error('Failed to update project:', error);
            errorToast('Failed to update project');
            // Revert optimistic update on error
            queryClient.setQueryData(queryKey, (oldData: Project[]) => {
              if (!oldData) return oldData;
              return oldData.map((project: Project) => 
                project.id === id 
                  ? { 
                      ...project,
                      data: {
                        title: projectToUpdate.data.title,
                        pks: projectToUpdate.data.pks
                      }
                    }
                  : project
              );
            });
          }
        });
      }
    } else if (type === 'query') {
      const queryKey = ['userQueries'];
      // Find the query and update it
      const queryToUpdate = queries.find(q => q.data.qid === id);
      if (queryToUpdate) {
        // Optimistically update the React Query cache
        queryClient.setQueryData(queryKey, (oldData: UserQueryObject[]) => {
          if (!oldData) return oldData;
          return oldData.map((query: UserQueryObject) => 
            query.data.qid === id 
              ? { 
                  ...query, 
                  data: { ...query.data, title: newName || query.data.title }
                }
              : query
          );
        });

        updateQueriesMutation.mutate([{
          qid: queryToUpdate.data.qid,
          title: newName || queryToUpdate.data.title || ''
        }], {
          onSuccess: () => {
            handleSetIsEditing(false);
            queryUpdatedToast();
          },
          onError: (error) => {
            console.error('Failed to update query:', error);
            errorToast('Failed to update query');
            // Revert optimistic update on error
            queryClient.setQueryData(queryKey, (oldData: UserQueryObject[]) => {
              if (!oldData) return oldData;
              return oldData.map((query: UserQueryObject) => 
                query.data.qid === id 
                  ? { 
                      ...query, 
                      data: { ...query.data, title: queryToUpdate.data.title }
                    }
                  : query
              );
            });
          }
        });
      }
    }
  };

  const handleCancelEdit = () => {
    handleSetIsEditing(false, undefined);
  };

  const handleRestoreProject = (project: Project) => {
    const queryKey = ['userProjects'];
    // Optimistically update the React Query cache
    queryClient.setQueryData(queryKey, (oldData: Project[]) => {
      if (!oldData) return oldData;
      return oldData.map((p: Project) => 
        p.id === project.id 
          ? { ...p, data: { ...p.data, is_deleted: false } }
          : p
      );
    });

    restoreProjectsMutation.mutate([project.id.toString()], {
      onSuccess: () => {
        projectRestoredToast();
      },
      onError: (error) => {
        console.error('Failed to restore project:', error);
        errorToast('Failed to restore project');
        // Revert optimistic update on error
        queryClient.setQueryData(queryKey, (oldData: Project[]) => {
          if (!oldData) return oldData;
          return oldData.map((p: Project) => 
            p.id === project.id 
              ? { ...p, data: { ...p.data, is_deleted: true } }
              : p
          );
        });
      }
    });
  };

  const handleDeleteProject = (project: Project) => {
    const queryKey = ['userProjects'];
    // Optimistically update the React Query cache
    queryClient.setQueryData(queryKey, (oldData: Project[]) => {
      if (!oldData) return oldData;
      return oldData.map((p: Project) => 
        p.id === project.id 
          ? { ...p, data: { ...p.data, is_deleted: true } }
          : p
      );
    });

    deleteProjectsMutation.mutate([project.id.toString()], {
      onSuccess: () => {
        projectDeletedToast();
      },
      onError: (error) => {
        console.error('Failed to delete project:', error);
        errorToast('Failed to delete project');
        // Revert optimistic update on error
        queryClient.setQueryData(queryKey, (oldData: Project[]) => {
          if (!oldData) return oldData;
          return oldData.map((p: Project) => 
            p.id === project.id 
              ? { ...p, data: { ...p.data, is_deleted: false } }
              : p
          );
        });
      }
    });
  };

  const handleRestoreQuery = (query: UserQueryObject) => {
    const queryKey = ['userQueries'];
    // Optimistically update the React Query cache
    queryClient.setQueryData(queryKey, (oldData: UserQueryObject[]) => {
      if (!oldData) return oldData;
      return oldData.map((q: UserQueryObject) => 
        q.data.qid === query.data.qid 
          ? { ...q, data: { ...q.data, is_deleted: false } }
          : q
      );
    });

    restoreQueriesMutation.mutate([query.data.qid.toString()], {
      onSuccess: () => {
        queryRestoredToast();
      },
      onError: (error) => {
        console.error('Failed to restore query:', error);
        errorToast('Failed to restore query');
        // Revert optimistic update on error
        queryClient.setQueryData(queryKey, (oldData: UserQueryObject[]) => {
          if (!oldData) return oldData;
          return oldData.map((q: UserQueryObject) => 
            q.data.qid === query.data.qid 
              ? { ...q, data: { ...q.data, is_deleted: true } }
              : q
          );
        });
      }
    });
  };

  const handleDeleteQuery = (query: UserQueryObject) => {
    const queryKey = ['userQueries'];
    // Optimistically update the React Query cache
    queryClient.setQueryData(queryKey, (oldData: UserQueryObject[]) => {
      if (!oldData) return oldData;
      return oldData.map((q: UserQueryObject) => 
        q.data.qid === query.data.qid 
          ? { ...q, data: { ...q.data, is_deleted: true } }
          : q
      );
    });

    deleteQueriesMutation.mutate([query.data.qid.toString()], {
      onSuccess: () => {
        queryDeletedToast();
      },
      onError: (error) => {
        console.error('Failed to delete query:', error);
        errorToast('Failed to delete query');
        // Revert optimistic update on error
        queryClient.setQueryData(queryKey, (oldData: UserQueryObject[]) => {
          if (!oldData) return oldData;
          return oldData.map((q: UserQueryObject) => 
            q.data.qid === query.data.qid 
              ? { ...q, data: { ...q.data, is_deleted: false } }
              : q
          );
        });
      }
    });
  };

  return {
    handleEditProject,
    handleEditQuery,
    handleUpdateItem,
    handleCancelEdit,
    handleRestoreProject,
    handleDeleteProject,
    handleRestoreQuery,
    handleDeleteQuery
  };
}; 

/**
 * Handles the post-deletion of projects by removing them from the userProjects query.
 * @param queryClient - The query client.
 * @param selectedProjects - The projects to delete.
 * @param setSelectedProjects - The function to set the selected projects.
 */
export const handlePostProjectDeletion = (queryClient: QueryClient, selectedProjects: Project[], setSelectedProjects: (projects: Project[]) => void) => {
  queryClient.setQueryData(['userProjects'], (oldData: Project[]) => {
    if (!oldData) return oldData;
    return oldData.filter((project: Project) => !selectedProjects.some(p => p.id === project.id));
  });
  setSelectedProjects([]);
};

/**
 * Handles the post-deletion of queries by removing them from the userQueries query.
 * @param queryClient - The query client.
 * @param selectedQueries - The queries to delete.
 * @param setSelectedQueries - The function to set the selected queries.
 */
export const handlePostQueryDeletion = (queryClient: QueryClient, selectedQueries: UserQueryObject[], setSelectedQueries: (queries: UserQueryObject[]) => void) => {
  queryClient.setQueryData(['userQueries'], (oldData: UserQueryObject[]) => {
    if (!oldData) return oldData;
    return oldData.filter((query: UserQueryObject) => !selectedQueries.some(q => q.data.qid === query.data.qid));
  });
  setSelectedQueries([]);
};
