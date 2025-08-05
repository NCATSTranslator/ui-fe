import { Dispatch, SetStateAction, useState } from 'react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { Project, QueryStatusObject } from '@/features/Projects/types/projects.d';
import { useUpdateProjects, useUpdateQueries } from '@/features/Projects/hooks/customHooks';

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
  handleEditQuery: (query: QueryStatusObject) => void;
  handleUpdateItem: (id: number | string, type: 'project' | 'query', newName?: string, newQids?: string[]) => void;
  handleCancelEdit: () => void;
}

/**
 * Handles the edit state.
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
 * @param editState - The state of the edit.
 * @param setEditState - The function to set the edit state.
 * @param projects - The projects to edit.
 * @param queries - The queries to edit.
 */
export const useEditProjectQueryHandlers = (
  editState: EditProjectQueryState,
  setEditState: Dispatch<SetStateAction<EditProjectQueryState>>,
  projects: Project[],
  queries: QueryStatusObject[]
): EditHandlers => {
  const queryClient = useQueryClient();
  const updateProjectsMutation = useUpdateProjects();
  const updateQueriesMutation = useUpdateQueries();

  const handleEditProject = (project: Project) => {
    setEditState({
      isEditing: true,
      editingItem: { 
        id: project.id, 
        name: project.data.title, 
        type: 'project',
        queryIds: project.data.pks
      }
    });
  };

  const handleEditQuery = (query: QueryStatusObject) => {
    setEditState({
      isEditing: true,
      editingItem: { id: query.data.qid, name: query.data.title, type: 'query' }
    });
  };

  const handleUpdateItem = (id: number | string, type: 'project' | 'query', newName?: string, newQids?: string[]) => {
    if (type === 'project') {
      // Find the project and update it
      const projectToUpdate = projects.find(p => p.id === id);
      if (projectToUpdate) {
        // Optimistically update the React Query cache
        queryClient.setQueryData(['userProjects'], (oldData: Project[]) => {
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
            setEditState({ isEditing: false, editingItem: undefined });
          },
          onError: (error) => {
            console.error('Failed to update project:', error);
            // Revert optimistic update on error
            queryClient.setQueryData(['userProjects'], (oldData: Project[]) => {
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
      // Find the query and update it
      const queryToUpdate = queries.find(q => q.data.qid === id);
      if (queryToUpdate) {
        // Optimistically update the React Query cache
        queryClient.setQueryData(['userQueryStatus'], (oldData: QueryStatusObject[]) => {
          if (!oldData) return oldData;
          return oldData.map((query: QueryStatusObject) => 
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
          title: newName || queryToUpdate.data.title
        }], {
          onSuccess: () => {
            setEditState({ isEditing: false, editingItem: undefined });
          },
          onError: (error) => {
            console.error('Failed to update query:', error);
            // Revert optimistic update on error
            queryClient.setQueryData(['userQueryStatus'], (oldData: QueryStatusObject[]) => {
              if (!oldData) return oldData;
              return oldData.map((query: QueryStatusObject) => 
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
    setEditState({ isEditing: false, editingItem: undefined });
  };

  return {
    handleEditProject,
    handleEditQuery,
    handleUpdateItem,
    handleCancelEdit
  };
}; 

/**
 * Handles the post-deletion of projects.
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
 * Handles the post-deletion of queries.
 * @param queryClient - The query client.
 * @param selectedQueries - The queries to delete.
 * @param setSelectedQueries - The function to set the selected queries.
 */
export const handlePostQueryDeletion = (queryClient: QueryClient, selectedQueries: QueryStatusObject[], setSelectedQueries: (queries: QueryStatusObject[]) => void) => {
  queryClient.setQueryData(['userQueryStatus'], (oldData: QueryStatusObject[]) => {
    if (!oldData) return oldData;
    return oldData.filter((query: QueryStatusObject) => !selectedQueries.some(q => q.data.qid === query.data.qid));
  });
  setSelectedQueries([]);
};
