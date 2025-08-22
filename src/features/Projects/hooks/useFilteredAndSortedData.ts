import { useMemo } from 'react';
import { filterAndSortProjects, filterAndSortQueries } from '@/features/Projects/utils/filterAndSortingFunctions';
import { isUnassignedProject } from '@/features/Projects/utils/editUpdateFunctions';
import { Project, UserQueryObject, SortField, SortDirection } from '@/features/Projects/types/projects.d';

interface UseFilteredAndSortedDataProps {
  activeProjects: Project[];
  deletedProjects: Project[];
  activeQueries: UserQueryObject[];
  deletedQueries: UserQueryObject[];
  sortField: SortField;
  sortDirection: SortDirection;
  searchTerm: string;
}

/**
 * Hook to filter and sort project/query data using existing utility functions
 * Provides memoized sorted data for all tabs in ProjectListInner
 * @returns {Object} - An object containing the sorted data for all tabs
 */
export const useFilteredAndSortedData = ({
  activeProjects,
  deletedProjects,
  activeQueries,
  deletedQueries,
  sortField,
  sortDirection,
  searchTerm
}: UseFilteredAndSortedDataProps) => {
  const sortedActiveProjects = useMemo(
    () => filterAndSortProjects(activeProjects, activeQueries, sortField, sortDirection, searchTerm),
    [activeProjects, activeQueries, sortField, sortDirection, searchTerm]
  );

  const sortedActiveQueries = useMemo(
    () => filterAndSortQueries(activeQueries, sortField, sortDirection, searchTerm),
    [activeQueries, sortField, sortDirection, searchTerm]
  );

  const sortedDeletedProjects = useMemo(
    () => filterAndSortProjects(
      deletedProjects.filter(project => !isUnassignedProject(project)), 
      deletedQueries, 
      sortField, 
      sortDirection, 
      searchTerm
    ),
    [deletedProjects, deletedQueries, sortField, sortDirection, searchTerm]
  );

  const sortedDeletedQueries = useMemo(
    () => filterAndSortQueries(deletedQueries, sortField, sortDirection, searchTerm),
    [deletedQueries, sortField, sortDirection, searchTerm]
  );

  // Calculate tab visibility based on search results and editing state
  const hideProjectsTab = (searchTerm.length > 0 && sortedActiveProjects.length === 0);
  const hideQueriesTab = (searchTerm.length > 0 && sortedActiveQueries.length === 0);
  const hideTrashTab = (searchTerm.length > 0 && sortedDeletedProjects.length === 0 && sortedDeletedQueries.length === 0);
  const hideAllTabs = hideProjectsTab && hideQueriesTab && hideTrashTab;

  // Check if projects are empty (accounting for unassigned project)
  const projectsEmpty = sortedActiveProjects.length === 0 || 
    (sortedActiveProjects.length === 1 && sortedActiveProjects.some(p => isUnassignedProject(p)));

  return {
    sortedActiveProjects,
    sortedActiveQueries,
    sortedDeletedProjects,
    sortedDeletedQueries,
    tabVisibility: {
      hideProjectsTab,
      hideQueriesTab,
      hideTrashTab,
      hideAllTabs
    },
    projectsEmpty
  };
};
