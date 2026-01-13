import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';
import { createProject, deleteProjects, deleteQueries, getUserProjects, getUserQueries, 
  restoreProjects, restoreQueries, touchQuery, updateProjects, updateQuery } from '@/features/Projects/utils/projectsApi';
import { ProjectCreate, ProjectUpdate, ProjectRaw, UserQueryObject, Project, QueryUpdate, SortField, SortDirection, SortSearchState } from '@/features/Projects/types/projects.d';
import { fetcNodeNameFromCurie, generateQueryTitle, findAllCuriesInTitle } from '@/features/Projects/utils/utilities';
import { getBaseTitle, extractAllCuriesFromTitles, replaceCuriesInTitle, hasTitleBeenUpdated, createUpdatedQueryWithTitle } from '@/features/Projects/utils/queryTitleUtils';
import { useSelector } from 'react-redux';
import { currentConfig, currentUser } from '@/features/UserAuth/slices/userSlice';
import { filterAndSortProjects } from '@/features/Projects/utils/filterAndSortingFunctions';
import { useSimpleSearch } from '@/features/Common/hooks/simpleSearchHook';

/**
 * Hook to fetch user projects with React Query
 */
export const useUserProjects = () => {
  const user = useSelector(currentUser);
  const shouldFetch = user !== null;
  return useQuery({
    queryKey: ['userProjects'],
    queryFn: () => getUserProjects(),
    enabled: shouldFetch,
    staleTime: Infinity, // only considered stale if query is manually invalidated
    refetchInterval: 30 * 1000, // 30s
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    retry: false,
  });
};

/**
 * Hook to fetch user queries with React Query
 */
export const useUserQueries = () => {
  const user = useSelector(currentUser);
  const shouldFetch = user !== null;
  const config = useSelector(currentConfig);
  const refetchInterval = config?.include_query_status_polling ? 15 * 1000 : false; // 15s
  const query = useQuery({
    queryKey: ['userQueries'],
    queryFn: () => getUserQueries(),
    enabled: shouldFetch,
    staleTime: Infinity, // only considered stale if query is manually invalidated
    refetchInterval: refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
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
      queryClient.invalidateQueries({ queryKey: ['userQueries'] });
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
      queryClient.invalidateQueries({ queryKey: ['userQueries'] });
    },
  });
};

/**
 * Hook to update queries with React Query
 */
export const useUpdateQuery = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (query: QueryUpdate) => updateQuery(query),
    onSuccess: () => {
      // Invalidate and refetch user query status
      queryClient.invalidateQueries({ queryKey: ['userQueries'] });
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
  sortSearchState: SortSearchState
): Project[] => {
  return useMemo(() => {
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
    
    return filterAndSortProjects(formattedProjects, queries, sortSearchState.sortField, sortSearchState.sortDirection, sortSearchState.searchTerm);
  }, [projects, queries, sortSearchState]);
};

/**
 * Custom hook to manage sort and search state
 * @returns {SortField} sortField - The field to sort by
 * @returns {SortDirection} sortDirection - The direction to sort in
 * @returns {string} searchTerm - The search term to filter by
 * @returns {Function} setSortField - Function to set the sort field
 * @returns {Function} setSortDirection - Function to set the sort direction
 * @returns {Function} handleSearch - Function to handle searching
 * @returns {Function} handleSort - Function to handle sorting
 * @returns {Function} clearSearchTerm - Function to clear the search term
 * @returns {Function} resetState - Function to reset the state
 */
export const useSortSearchState = () => {
  const [sortField, setSortField] = useState<SortField>('lastSeen');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { searchTerm, handleSearch } = useSimpleSearch();

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const clearSearchTerm = useCallback(() => {
    handleSearch('');
  }, [handleSearch]);

  const resetState = useCallback(() => {
    setSortField('lastSeen');
    setSortDirection('desc');
    handleSearch('');
  }, [handleSearch]);

  return useMemo(() => ({
    // State
    sortField,
    sortDirection,
    searchTerm,
    
    // Setters
    setSortField,
    setSortDirection,
    
    // Handlers
    handleSearch,
    handleSort,
    clearSearchTerm,
    resetState
  }), [sortField, sortDirection, searchTerm, handleSearch, handleSort, clearSearchTerm, resetState]);
};

/**
 * Hook to fetch resolved names for multiple curies using React Query
 * @param {string[]} curies - The curie strings to resolve
 * @param {boolean} enabled - Whether the queries should be enabled
 * @returns {Record<string, string>, boolean} Object with curie->name mapping and loading state
 */
export const useMultipleResolvedCurieNames = (curies: string[], enabled: boolean = true) => {
  const queries = useQuery({
    queryKey: ['curieNames', curies],
    queryFn: async () => {
      const results: Record<string, string> = {};
      await Promise.all(
        curies.map(async (curie) => {
          try {
            const name = await fetcNodeNameFromCurie(curie);
            results[curie] = name;
          } catch (error) {
            console.error(`Failed to resolve curie ${curie}:`, error);
            results[curie] = curie; // fallback to original curie
          }
        })
      );
      return results;
    },
    enabled: enabled && curies.length > 0,
    staleTime: Infinity,
    retry: false,
  });

  return {
    data: queries.data || {},
    isLoading: queries.isLoading,
  };
};

/**
 * Hook to get query card title with async curie name resolution
 * @param {UserQueryObject} query - The query object
 * @returns { title: string; isLoading: boolean } Object with title and loading state
 */
export const useGetQueryCardTitle = (query: UserQueryObject | null): { title: string; isLoading: boolean } => {
  
  const updateQueryMutation = useUpdateQuery();
  const baseTitle = useMemo(() => 
    query ? getBaseTitle(query) : '', 
    [query]
  );
  
  const curies = useMemo(() => 
    query ? findAllCuriesInTitle(baseTitle) : [], 
    [baseTitle]
  );
  
  const { data: resolvedNames, isLoading } = useMultipleResolvedCurieNames(
    curies,
    curies.length > 0
  );
  
  const title = useMemo(() => {
    if(query === null)
      return baseTitle;
      
    const updatedTitle = replaceCuriesInTitle(baseTitle, resolvedNames);
    
    // Only update if we actually made replacements
    if (hasTitleBeenUpdated(baseTitle, updatedTitle)) {
      // call update query endpoint
      // updateQueryMutation.mutate({
      //   id: query.sid,
      //   title: updatedTitle
      // });
      return updatedTitle;
    }
    
    return baseTitle;
  }, [curies, resolvedNames, baseTitle, updateQueryMutation, query?.sid]);
  
  return { title, isLoading };
};

/**
 * Hook to get queries with updated titles for multiple queries with async curie name resolution
 * @param {UserQueryObject[]} queries - Array of query objects
 * @returns { queries: UserQueryObject[]; isLoading: boolean } Array of query objects with updated titles and loading state
 */
export const useGetQueriesUpdatedTitles = (queries: UserQueryObject[]): { queries: UserQueryObject[]; isLoading: boolean } => {
  const updateQueryMutation = useUpdateQuery();
  
  const baseTitles = useMemo(() => 
    queries.reduce((acc, query) => {
      acc[query.data.qid] = getBaseTitle(query);
      return acc;
    }, {} as Record<string, string>), 
    [queries]
  );
  
  const allCuries = useMemo(() => 
    extractAllCuriesFromTitles(Object.values(baseTitles)), 
    [baseTitles]
  );
  
  const { data: resolvedNames, isLoading } = useMultipleResolvedCurieNames(
    allCuries,
    allCuries.length > 0
  );
  
  const updatedQueries = useMemo(() => {
    return queries.map(query => {
      const baseTitle = baseTitles[query.data.qid];
      const updatedTitle = replaceCuriesInTitle(baseTitle, resolvedNames);
      
      // Only update if we actually made replacements
      if (hasTitleBeenUpdated(baseTitle, updatedTitle)) {
        // call update query endpoint
        // updateQueryMutation.mutate({
        //   id: query.sid,
        //   title: updatedTitle
        // });
        return createUpdatedQueryWithTitle(query, updatedTitle);
      }
      
      // Return query with base title if no updates needed
      return createUpdatedQueryWithTitle(query, baseTitle);
    });
  }, [queries, baseTitles, allCuries, resolvedNames, updateQueryMutation]);
  
  return { queries: updatedQueries, isLoading };
};

/**
 * Hook to update the query last_seen timestamp
 * 
 * @param sid - The query save ID
 */
export const useUpdateQueryLastSeen = (sid?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!sid) {
        console.log("No query save ID provided, skipping query last_seen timestamp update");
        return;
      }
      await touchQuery(
        sid, 
        () => console.warn('http error updating query last_seen timestamp'), 
        () => console.warn('fetch error updating query last_seen timestamp')
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userQueries'] });
    },
    onError: (error) => {
      console.error('Error updating query last_seen timestamp:', error);
    },
  });
};
