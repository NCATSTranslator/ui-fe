import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUserProjects, useUserQueries, useFormattedProjects } from './customHooks';
import { UserQueryObject } from '@/features/Projects/types/projects.d';

/**
 * Hook to manage data fetching and processing for ProjectDetailInner
 * Handles project and query data fetching, formatting, and filtering for a specific project
 * @returns {Object} - An object containing the project data, queries, loading states, and error states
 */
export const useProjectDetailData = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useUserProjects();
  const { data: queries = [], isLoading: queriesLoading, error: queriesError } = useUserQueries();
  
  const formattedProjects = useFormattedProjects(projects, queries);
  
  const project = useMemo(() => {
    return formattedProjects.find((p) => p.id === Number(projectId));
  }, [formattedProjects, projectId]);

  const projectQueries = useMemo(() => {
    if (!project) return [] as UserQueryObject[];
    return queries.filter((q: UserQueryObject) => project.data.pks.includes(q.data.qid));
  }, [project, queries]);

  return {
    project,
    projectQueries,
    raw: {
      projects,
      queries
    },
    formatted: {
      projects: formattedProjects
    },
    loading: {
      projectsLoading,
      queriesLoading
    },
    errors: {
      projectsError,
      queriesError
    }
  };
};
