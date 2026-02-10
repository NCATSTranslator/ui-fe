import { useMemo } from 'react';
import { filterAndSortQueries } from '@/features/Projects/utils/filterAndSortingFunctions';
import { UserQueryObject, SortField, SortDirection } from '@/features/Projects/types/projects.d';
import { getAdditionalQueries } from '@/features/Projects/utils/utilities';

interface UseProjectDetailSortedDataProps {
  rawQueries: UserQueryObject[];
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
  rawQueries,
  projectQueries,
  sortField,
  sortDirection,
  searchTerm
}: UseProjectDetailSortedDataProps) => {
  const sortedQueries = useMemo(
    () => filterAndSortQueries(projectQueries, sortField, sortDirection, searchTerm).filter((query) => !query.data.deleted),
    [projectQueries, sortField, sortDirection, searchTerm]
  );

  const additionalQueries = useMemo(
    () => getAdditionalQueries(rawQueries, sortedQueries),
    [rawQueries, sortedQueries]
  );

  const deletedQueries = useMemo(
    () => projectQueries.filter((query) => query.data.deleted),
    [projectQueries]
  );

  return {
    additionalQueries,
    sortedQueries,
    deletedQueries
  };
};
