import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createProject, deleteProjects, deleteQueries, getUserProjects, getUserQueryStatus, 
  restoreProjects, restoreQueries, updateProjects } from '@/features/Projects/utils/projectsApi';
import { ProjectCreate, ProjectUpdate, ProjectRaw, QueryStatusObject, Project } from '@/features/Projects/types/projects.d';

/**
 * Hook to fetch user projects with React Query
 */
export const useUserProjects = () => {
  return useQuery({
    queryKey: ['userProjects'],
    queryFn: () => getUserProjects(),
    staleTime: 5 * 60 * 1000, // 5m
    retry: 3,
  });
};

/**
 * Hook to fetch user query status with React Query
 */
export const useUserQueryStatus = () => {
  return useQuery({
    queryKey: ['userQueryStatus'],
    queryFn: () => getUserQueryStatus(),
    staleTime: 30 * 1000, // 30s
    retry: 3,
  });
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
 * Generic hook that formats and enhances project data with various calculated fields.
 * Currently includes bookmark and note counts, but can be extended for other formatting needs.
 * Results are memoized to avoid recalculating on every render.
 * @param {ProjectRaw[]} projects - The raw projects to format
 * @param {QueryStatusObject[]} queries - The queries to use for calculations
 * @returns {Project[]} The formatted projects with calculated fields
 */
export const useFormattedProjects = (
  projects: ProjectRaw[], 
  queries: QueryStatusObject[]
): Project[] => {
  return useMemo(() => {
    return projects.map(project => {
      // Find all queries that belong to this project
      const projectQueries = queries.filter(q => project.qids.includes(q.data.qid));
      
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
  }, [projects, queries]);
};
