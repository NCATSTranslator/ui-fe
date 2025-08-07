import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createProject, deleteProjects, deleteQueries, getUserProjects, getUserQueries, 
  restoreProjects, restoreQueries, updateProjects, updateQueries } from '@/features/Projects/utils/projectsApi';
import { ProjectCreate, ProjectUpdate, ProjectRaw, UserQueryObject, Project, QueryUpdate } from '@/features/Projects/types/projects.d';
import { handlePostProjectDeletion, handlePostQueryDeletion } from '../utils/editUpdateFunctions';
import { generateQueryTitle } from '@/features/Projects/utils/utilities';
import { errorToast, projectDeletedToast, queryDeletedToast } from '../utils/toastMessages';

/**
 * Hook to fetch user projects with React Query
 */
export const useUserProjects = () => {
  return useQuery({
    queryKey: ['userProjects'],
    queryFn: () => getUserProjects(),
    staleTime: 5 * 60 * 1000, // 5m
    retry: false,
  });
};

/**
 * Hook to fetch user queries with React Query
 */
export const useUserQueries = () => {
  const query = useQuery({
    queryKey: ['userQueries'],
    queryFn: () => getUserQueries(),
    staleTime: 30 * 1000, // 30s
    retry: false,
  });

  // Process queries to replace null titles with generated titles
  const processedData = useMemo(() => {
    if (!query.data) return query.data;
    
    return query.data.map(query => {
      if (query.data.title === null) {
        return {
          ...query,
          data: {
            ...query.data,
            title: generateQueryTitle(query)
          }
        };
      }
      return query;
    });
  }, [query.data]);

  return {
    ...query,
    data: processedData
  };
};

/**
 * Hook to create a project with React Query
 */
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projectData: ProjectCreate) => createProject(projectData),
    onSuccess: () => {
      // Invalidate and refetch user projects
      queryClient.invalidateQueries({ queryKey: ['userProjects'] });
    },
  });
};

/**
 * Hook to update projects with React Query
 */
export const useUpdateProjects = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projects: ProjectUpdate[]) => updateProjects(projects),
    onSuccess: () => {
      // Invalidate and refetch user projects
      queryClient.invalidateQueries({ queryKey: ['userProjects'] });
    },
  });
};

/**
 * Hook to delete projects with React Query
 */
export const useDeleteProjects = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projectIds: string[]) => deleteProjects(projectIds),
    onSuccess: () => {
      // Invalidate and refetch user projects
      queryClient.invalidateQueries({ queryKey: ['userProjects'] });
    },
  });
};

/**
 * Hook to restore projects with React Query
 */
export const useRestoreProjects = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projectIds: string[]) => restoreProjects(projectIds),
    onSuccess: () => {
      // Invalidate and refetch user projects
      queryClient.invalidateQueries({ queryKey: ['userProjects'] });
    },
  });
};

/**
 * Hook to delete queries with React Query
 */
export const useDeleteQueries = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (queryIds: string[]) => deleteQueries(queryIds),
    onSuccess: () => {
      // Invalidate and refetch user query status
      queryClient.invalidateQueries({ queryKey: ['userQueryStatus'] });
    },
  });
};

/**
 * Hook to restore queries with React Query
 */
export const useRestoreQueries = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (queryIds: string[]) => restoreQueries(queryIds),
    onSuccess: () => {
      // Invalidate and refetch user query status
      queryClient.invalidateQueries({ queryKey: ['userQueryStatus'] });
    },
  });
};

/**
 * Hook to update queries with React Query
 */
export const useUpdateQueries = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (queries: QueryUpdate[]) => updateQueries(queries),
    onSuccess: () => {
      // Invalidate and refetch user query status
      queryClient.invalidateQueries({ queryKey: ['userQueryStatus'] });
    },
  });
};

/**
 * Generic hook that formats and enhances project data with various calculated fields.
 * Currently includes bookmark and note counts, but can be extended for other formatting needs.
 * Results are memoized to avoid recalculating on every render.
 * @param {ProjectRaw[]} projects - The raw projects to format
 * @param {UserQueryObject[]} queries - The queries to use for calculations
 * @returns {Project[]} The formatted projects with calculated fields
 */
export const useFormattedProjects = (
  projects: ProjectRaw[], 
  queries: UserQueryObject[],
  includeUnassigned: boolean = true
): Project[] => {
  return useMemo(() => {
    // Get all query IDs that are assigned to projects
    const assignedQueryIds = new Set(projects.flatMap(project => project.data.pks));
    
    // Find unassigned queries (queries that are not in any project)
    const unassignedQueries = queries.filter(q => !assignedQueryIds.has(q.data.qid));
    
    // Calculate bookmark and note counts for unassigned queries
    const unassignedBookmarkCount = unassignedQueries.reduce(
      (sum, q) => sum + q.data.bookmark_ids.length, 
      0
    );
    const unassignedNoteCount = unassignedQueries.reduce(
      (sum, q) => sum + q.data.note_count, 
      0
    );
    
    // Create the unassigned project
    const unassignedProject: Project = {
      id: -1, // Special ID for unassigned project
      data: {
        pks: unassignedQueries.map(q => q.data.qid),
        title: 'Unassigned'
      },
      time_created: new Date(0), // Use epoch time for unassigned
      time_updated: new Date(0), // Use epoch time for unassigned
      deleted: false,
      bookmark_count: unassignedBookmarkCount,
      note_count: unassignedNoteCount,
      save_type: 'project',
      ars_pkey: null,
      label: null,
      notes: null,
      object_ref: null,
      user_id: null
    };
    
    // Format regular projects
    const formattedProjects = projects.map(project => {
      // Find all queries that belong to this project
      const projectQueries = queries.filter(q => project.data.pks.includes(q.data.qid));
      
      // Calculate total bookmark count
      const bookmark_count = projectQueries.reduce(
        (sum, q) => sum + q.data.bookmark_ids.length, 
        0
      );
      
      // Calculate total note count
      const note_count = projectQueries.reduce(
        (sum, q) => sum + q.data.note_count, 
        0
      );
      
      // Return enhanced project with calculated fields
      return {
        ...project,
        bookmark_count,
        note_count
      };
    });
    
    // Return formatted projects with unassigned project appended
    return includeUnassigned ? [...formattedProjects, unassignedProject] : formattedProjects;
  }, [projects, queries]);
};

//   const queryClient = useQueryClient();
//   const { mutate: deleteProjects } = useDeleteProjects();
//   const { mutate: deleteQueries } = useDeleteQueries();

//   return (selectedProjects: Project[], setSelectedProjects: (projects: Project[]) => void, selectedQueries: UserQueryObject[], setSelectedQueries: (queries: UserQueryObject[]) => void) => {
//     if(selectedProjects.length > 0) {
//       deleteProjects(selectedProjects.map(project => project.id.toString()), {
//         onSuccess: () => {
//           handlePostProjectDeletion(queryClient, selectedProjects, setSelectedProjects);
//           projectDeletedToast();
//         },
//         onError: (error) => { 
//           handlePostProjectDeletion(queryClient, selectedProjects, setSelectedProjects);
//           console.error(error);
//           errorToast('Failed to delete project');
//         }
//       });
//     }
//     if(selectedQueries.length > 0) {  
//       deleteQueries(selectedQueries.map(query => query.data.qid.toString()), {
//         onSuccess: () => {
//           handlePostQueryDeletion(queryClient, selectedQueries, setSelectedQueries);
//           queryDeletedToast();
//         },
//         onError: (error) => {
//           handlePostQueryDeletion(queryClient, selectedQueries, setSelectedQueries); 
//           console.error(error);
//           errorToast('Failed to delete query');
//         }
//       });
//     }
//   };
// };