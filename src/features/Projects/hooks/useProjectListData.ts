import { useMemo } from 'react';
import { useUserProjects, useUserQueries, useFormattedProjects } from './customHooks';
import { ProjectRaw, UserQueryObject } from '@/features/Projects/types/projects.d';

/**
 * Hook to manage data fetching and formatting for ProjectListInner
 * Combines existing hooks and provides structured data for active/deleted projects and queries
 * @returns {Object} - An object containing the raw data, filtered data, formatted data, loading states, and error states
 */
export const useProjectListData = () => {
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useUserProjects();
  const { data: queries = [], isLoading: queriesLoading, error: queriesError } = useUserQueries();

  const dataFilters = useMemo(() => ({
    active: {
      projects: projects.filter((project: ProjectRaw) => !project.deleted),
      queries: queries.filter((query: UserQueryObject) => !query.data.deleted)
    },
    deleted: {
      projects: projects.filter((project: ProjectRaw) => project.deleted),
      queries: queries.filter((query: UserQueryObject) => query.data.deleted)
    }
  }), [projects, queries]);

  const activeFormattedProjects = useFormattedProjects(dataFilters.active.projects, queries);
  const deletedFormattedProjects = useFormattedProjects(dataFilters.deleted.projects, queries, false);

  return {
    raw: {
      projects,
      queries
    },
    filtered: dataFilters,
    formatted: {
      active: activeFormattedProjects,
      deleted: deletedFormattedProjects
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
