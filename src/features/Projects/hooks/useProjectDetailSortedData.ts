import { useMemo } from 'react';
import { filterAndSortQueries } from '@/features/Projects/utils/filterAndSortingFunctions';
import { UserQueryObject, SortField, SortDirection } from '@/features/Projects/types/projects.d';

interface UseProjectDetailSortedDataProps {
  projectQueries: UserQueryObject[];
  sortField: SortField;
  sortDirection: SortDirection;
  searchTerm: string;
}

/**
 * Hook to filter and sort query data for ProjectDetailInner
 * Provides memoized sorted queries using existing utility functions
 * @returns {Object} - An object containing the sorted queries
 */
export const useProjectDetailSortedData = ({
  projectQueries,
  sortField,
  sortDirection,
  searchTerm
}: UseProjectDetailSortedDataProps) => {
  const sortedQueries = useMemo(
    () => filterAndSortQueries(projectQueries, sortField, sortDirection, searchTerm),
    [projectQueries, sortField, sortDirection, searchTerm]
  );

  return {
    sortedQueries
  };
};
