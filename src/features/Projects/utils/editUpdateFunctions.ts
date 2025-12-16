import { Dispatch, SetStateAction, useState } from 'react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { Project, ProjectEditingItem, ProjectRaw, QueryEditingItem, UserQueryObject } from '@/features/Projects/types/projects.d';
import { useUpdateProjects, useUpdateQuery, useDeleteProjects, useRestoreProjects, useDeleteQueries, useRestoreQueries, useUserProjects, useUserQueries } from '@/features/Projects/hooks/customHooks';
import { errorToast, projectUpdatedToast, queryUpdatedToast, projectRestoredToast, projectDeletedToast, queryRestoredToast, queryDeletedToast } from '../../Core/utils/toastMessages';

export interface EditProjectState {
  isEditing: boolean;
  editingItem?: ProjectEditingItem;
}

export interface EditQueryState {
  isEditing: boolean;
  editingItem?: QueryEditingItem;
}

export interface EditProjectHandlers {
  handleEditProject: (project: Project) => void;
  handleUpdateProject: (id: number | string, newName?: string, newQids?: string[], onSuccess?: () => void, onError?: (error: Error) => void, noToast?: boolean) => void;
  handleCancelEdit: () => void;
  handleRestoreProject: (project: Project) => void;
  handleDeleteProject: (project: Project) => void;
  handlePermanentDeleteProject: (project: Project) => void;
}

export interface EditQueryHandlers {
  handleEditQuery: (query: UserQueryObject) => void;
  handleUpdateQuery: (id: number | string, newName?: string) => void;
  handleCancelEdit: () => void;
  handleRestoreQuery: (query: UserQueryObject) => void;
  handleDeleteQuery: (query: UserQueryObject) => void;
  handlePermanentDeleteQuery: (query: UserQueryObject) => void;
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
export const useEditQueryState = (): [EditQueryState, Dispatch<SetStateAction<EditQueryState>>] => {
  const [editState, setEditState] = useState<EditQueryState>({
    isEditing: false,
    editingItem: undefined
  });

  return [editState, setEditState];
};

/**
 * Handles the edit state of the project or query.
 * @returns The edit state and the function to set the state.
 */
export const useEditProjectState = (): [EditProjectState, Dispatch<SetStateAction<EditProjectState>>] => {
  const [editState, setEditState] = useState<EditProjectState>({
    isEditing: false,
    editingItem: undefined
  });

  return [editState, setEditState];
};

/**
 * Handles the editing of projects.
 * @param handleSetIsEditing - The function to handle setting the edit state.
 * @param projects - The projects to edit.
 */
export const useEditProjectHandlers = (): EditProjectHandlers => {
  const queryClient = useQueryClient();
  const { data: projects = [] } = useUserProjects();
  const { data: queries = [] } = useUserQueries();
  const updateProjectsMutation = useUpdateProjects();
  const deleteProjectsMutation = useDeleteProjects();
  const restoreProjectsMutation = useRestoreProjects();

  const handleEditProject = (project: Project) => {
    console.log('TODO: edit project', project);
  };

  /**
   * Handles the updating of a project.
   * @param {number | string} id - The id of the project to update.
   * @param {string} newName - Optional, a new name for the project.
   * @param {string[]} newQids - Optional, a new list of qids for the project. SHOULD INCLUDE ALL QIDS FOR THE PROJECT.
   */
  const handleUpdateProject = (id: number | string, newName?: string, newQids?: string[], onSuccess?: () => void, onError?: (error: Error) => void, noToast: boolean = false) => {
    if(!projects) {
      console.warn("projects is undefined");
      return;
    }
    // Find the project
    const projectToUpdate = projects.find(p => p.id === parseInt(id.toString()));
    if(!projectToUpdate) {
      console.error('Project not found:', id);
      return;
    }

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
    const projectTitle = newName || projectToUpdate.data.title;
    // check diff between newQids and projectToUpdate.data.pks. If different, get the titles of the newly included queries
    const newlyIncludedQids = newQids?.filter(qid => !projectToUpdate.data.pks.includes(qid));
    const newlyIncludedQueryTitles = newlyIncludedQids?.map(qid => {
      return queries.find(q => q.data.qid === qid)?.data.title || '';
    }).join(', ');
    const newlyRemovedQids = projectToUpdate.data.pks?.filter(qid => !newQids?.includes(qid));
    const newlyRemovedQueryTitles = newlyRemovedQids?.map(qid => {
      return queries.find(q => q.data.qid === qid)?.data.title || '';
    }).join(', ');

    const action = (newlyIncludedQueryTitles && newlyIncludedQueryTitles.length > 0)
      ? 'add'
      : (newlyRemovedQueryTitles && newlyRemovedQueryTitles.length > 0)
        ? 'remove'
        : undefined;

    updateProjectsMutation.mutate([{
      id: projectToUpdate.id,
      title: projectTitle,
      pks: newQids || projectToUpdate.data.pks
    }], {
      onSuccess: () => {
        if(!noToast) {
          if(action === 'remove')
            projectUpdatedToast(projectTitle, newlyRemovedQueryTitles, action);
          else if(action === 'add')
            projectUpdatedToast(projectTitle, newlyIncludedQueryTitles, action);
          else
            projectUpdatedToast(projectTitle);
        }

        if(onSuccess)
          onSuccess();
      },
      onError: (error) => {
        console.error('Failed to update project:', error);
        if(!noToast)
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
        if(onError)
          onError(error);
      }
    });
  };

  const handleCancelEdit = () => {
    console.log('TODO: cancel edit project');
  };

  const handleRestoreProject = (project: Project) => {
    const queryKey = ['userProjects'];
    // Optimistically update the React Query cache
    queryClient.setQueryData(queryKey, (oldData: Project[]) => {
      if (!oldData) return oldData;
      return oldData.map((p: Project) =>
        p.id === project.id
          ? { ...p, data: { ...p.data, deleted: false } }
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
              ? { ...p, data: { ...p.data, deleted: true } }
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
          ? { ...p, data: { ...p.data, deleted: true } }
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
              ? { ...p, data: { ...p.data, deleted: false } }
              : p
          );
        });
      }
    });
  };

  const handlePermanentDeleteProject = (project: Project) => {
    // TODO: Implement permanent delete project
    console.log('NOT IMPLEMENTED: Permanently deleting project:', project);
  };

  return {
    handleEditProject,
    handleUpdateProject,
    handleCancelEdit,
    handleRestoreProject,
    handleDeleteProject,
    handlePermanentDeleteProject
  };
};

/**
 * Handles the editing of queries.
 * @param handleSetIsEditing - The function to handle setting the edit state.
 * @param queries - The queries to edit.
 */
export const useEditQueryHandlers = (
  handleSetIsEditing?: (isEditing: boolean, editingItem?: QueryEditingItem) => void,
  queries?: UserQueryObject[]
): EditQueryHandlers => {
  const queryClient = useQueryClient();
  const updateQueryMutation = useUpdateQuery();
  const deleteQueriesMutation = useDeleteQueries();
  const restoreQueriesMutation = useRestoreQueries();

  const handleEditQuery = (query: UserQueryObject) => {
    if(!handleSetIsEditing) {
      console.warn("handleSetIsEditing not provided");
      return;
    }
    handleSetIsEditing(true, {
      pk: query.data.qid,
      name: query.data.title || '',
      type: 'query'
    });
  };

  const handleUpdateQuery = (id: number | string, newName?: string) => {
    if(!queries) {
      console.warn("queries is undefined");
      return;
    }
    const queryKey = ['userQueries'];
    // Find the query and update it
    const queryToUpdate = queries.find(q => q.sid === id);
    if (queryToUpdate) {
      // Optimistically update the React Query cache
      queryClient.setQueryData(queryKey, (oldData: UserQueryObject[]) => {
        if (!oldData) return oldData;
        return oldData.map((query: UserQueryObject) =>
          query.sid === id
            ? {
                ...query,
                data: { ...query.data, title: newName || query.data.title }
              }
            : query
        );
      });

      updateQueryMutation.mutate({
        id: queryToUpdate.sid,
        title: newName || queryToUpdate.data.title || ''
      }, {
        onSuccess: () => {
          queryUpdatedToast();
          if(!handleSetIsEditing) {
            console.warn("handleSetIsEditing not provided");
            return;
          }
          handleSetIsEditing(false);
        },
        onError: (error) => {
          console.error('Failed to update query:', error);
          errorToast('Failed to update query');
          // Revert optimistic update on error
          queryClient.setQueryData(queryKey, (oldData: UserQueryObject[]) => {
            if (!oldData) return oldData;
            return oldData.map((query: UserQueryObject) =>
              query.sid === id
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
  };

  const handleCancelEdit = () => {
    if(!handleSetIsEditing) {
      console.warn("handleSetIsEditing not provided");
      return;
    }
    handleSetIsEditing(false, undefined);
  };

  const handleRestoreQuery = (query: UserQueryObject) => {
    const queryKey = ['userQueries'];
    // Optimistically update the React Query cache
    queryClient.setQueryData(queryKey, (oldData: UserQueryObject[]) => {
      if (!oldData) return oldData;
      return oldData.map((q: UserQueryObject) => {
        return q.sid === query.sid
            ? { ...q, data: { ...q.data, deleted: false } }
            : q
      });
    });

    restoreQueriesMutation.mutate([query.sid.toString()], {
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
            q.sid === query.sid
              ? { ...q, data: { ...q.data, deleted: true } }
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
      return oldData.map((q: UserQueryObject) => {
        return q.sid === query.sid
            ? { ...q, data: { ...q.data, deleted: true } }
            : q
      });
    });

    deleteQueriesMutation.mutate([query.sid], {
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
            q.sid === query.sid
              ? { ...q, data: { ...q.data, deleted: false } }
              : q
          );
        });
      }
    });
  };

  const handlePermanentDeleteQuery = (query: UserQueryObject) => {
    // TODO: Implement permanent delete query
    console.log('NOT IMPLEMENTED: Permanently deleting query:', query);
  };

  return {
    handleEditQuery,
    handleUpdateQuery,
    handleCancelEdit,
    handleRestoreQuery,
    handleDeleteQuery,
    handlePermanentDeleteQuery
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

/**
 * Handles the setting of the editing state for a project.
 * @param isEditing - Whether the project is being edited.
 * @param editingItem - The editing item.
 * @param setProjectEditState - The function to set the project edit state.
 * @param activeQueries - The active queries.
 * @param setSelectedQueries - The function to set the selected queries.
 */
export const onSetIsEditingProject = (
  isEditing: boolean,
  activeQueries: UserQueryObject[],
  setProjectEditState: (state: EditProjectState) => void,
  setSelectedQueries: (queries: UserQueryObject[]) => void,
  editingItem?: ProjectEditingItem
) => {
  setProjectEditState({isEditing: isEditing, editingItem: editingItem || undefined});
  if(isEditing && (editingItem?.type === 'project' || !editingItem)) {
    const selectedQids = editingItem?.queryIds || [];
    const selectedQueries = activeQueries.filter(query => selectedQids.includes(query.data.qid));
    setSelectedQueries(selectedQueries);
  } else {
    setSelectedQueries([]);
  }
};

/**
 * Checks if the project is unassigned.
 * @param project - The project to check.
 * @returns True if the project is unassigned, false otherwise.
 */
export const isUnassignedProject = (project: Project | ProjectRaw | number) => {
  const id = typeof project === 'number' ? project : project.id;
  return id === -1;
};