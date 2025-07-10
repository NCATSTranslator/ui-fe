import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createProject, deleteProjects, deleteQueries, getUserProjects, getUserQueryStatus, 
  restoreProjects, restoreQueries, updateProjects } from '@/features/Projects/utils/projectsApi';
import { ProjectCreate, ProjectUpdate } from '@/features/Projects/types/projects';

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
