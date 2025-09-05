import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { createProject, deleteProjects, deleteQueries, getUserProjects, getUserQueries, 
  restoreProjects, restoreQueries, updateProjects, updateQuery } from '@/features/Projects/utils/projectsApi';
import { ProjectCreate, ProjectUpdate, ProjectRaw, UserQueryObject, Project, QueryUpdate, SortField, SortDirection } from '@/features/Projects/types/projects.d';
import { fetcNodeNameFromCurie, generateQueryTitle, queryTitleHasCurie } from '@/features/Projects/utils/utilities';
import { useSelector } from 'react-redux';
import { currentConfig } from '@/features/UserAuth/slices/userSlice';

/**
 * Hook to fetch user projects with React Query
 */
export const useUserProjects = () => {
  return useQuery({
    queryKey: ['userProjects'],
    queryFn: () => getUserProjects(),
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
  const config = useSelector(currentConfig);
  const refetchInterval = config?.include_query_status_polling ? 15 * 1000 : false; // 15s
  const query = useQuery({
    queryKey: ['userQueries'],
    queryFn: () => getUserQueries(),
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
  includeUnassigned: boolean = true
): Project[] => {
  return useMemo(() => {
    // Get all query IDs that are assigned to projects
    const assignedQueryIds = new Set(projects.flatMap(project => project.data.pks));
    
    // Find unassigned queries (queries that are not in any project)
    const unassignedQueries = queries.filter(q => !assignedQueryIds.has(q.data.qid) && !q.data.deleted);
    
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

/**
 * Custom hook to manage project queries state including sorting, selection, and search
 * @returns {SortField} sortField - The field to sort by
 * @returns {SortDirection} sortDirection - The direction to sort in
 * @returns {UserQueryObject[]} selectedQueries - The queries that are currently selected
 * @returns {Project[]} selectedProjects - The projects that are currently selected
 * @returns {string} searchTerm - The search term to filter queries by
 * @returns {Function} setSortField - Function to set the sort field
 * @returns {Function} setSortDirection - Function to set the sort direction
 * @returns {Function} setSelectedQueries - Function to set the selected queries
 * @returns {Function} setSelectedProjects - Function to set the selected projects
 * @returns {Function} handleSort - Function to handle sorting
 * @returns {Function} handleSelectQuery - Function to handle selecting a query
 * @returns {Function} handleSelectProject - Function to handle selecting a project
 * @returns {Function} handleSelectAllQueries - Function to handle selecting all queries
 * @returns {Function} handleSelectAllProjects - Function to handle selecting all projects
 * @returns {Function} clearSelectedQueries - Function to clear the selected queries
 * @returns {Function} clearSelectedProjects - Function to clear the selected projects
 * @returns {Function} clearSearchTerm - Function to clear the search term
 * @returns {Function} resetState - Function to reset the state
 */
export const useProjectDetailSortSearchSelectState = () => {
  const [sortField, setSortField] = useState<SortField>('lastSeen');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedQueries, setSelectedQueries] = useState<UserQueryObject[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectQuery = (query: UserQueryObject, isSelected: boolean) => {
    if (isSelected) {
      setSelectedQueries(prev => [...prev, query]);
    } else {
      setSelectedQueries(prev => prev.filter(q => q.data.qid !== query.data.qid));
    }
  };

  const handleSelectProject = (project: Project, isSelected: boolean) => {
    if (isSelected) {
      setSelectedProjects(prev => [...prev, project]);
    } else {
      setSelectedProjects(prev => prev.filter(p => p.id !== project.id));
    }
  };

  const handleSelectAllQueries = (queries: UserQueryObject[], isSelected: boolean) => {
    if (isSelected) {
      setSelectedQueries(queries);
    } else {
      setSelectedQueries([]);
    }
  };

  const handleSelectAllProjects = (projects: Project[], isSelected: boolean) => {
    if (isSelected) {
      setSelectedProjects(projects);
    } else {
      setSelectedProjects([]);
    }
  };

  const clearSelectedQueries = () => {
    setSelectedQueries([]);
  };

  const clearSelectedProjects = () => {
    setSelectedProjects([]);
  };

  const clearSearchTerm = () => {
    setSearchTerm('');
  };

  const resetState = () => {
    setSortField('lastSeen');
    setSortDirection('desc');
    setSelectedQueries([]);
    setSelectedProjects([]);
    setSearchTerm('');
  };

  return {
    // State
    sortField,
    sortDirection,
    selectedQueries,
    selectedProjects,
    searchTerm,
    
    // Setters
    setSortField,
    setSortDirection,
    setSelectedQueries,
    setSelectedProjects,
    setSearchTerm,
    
    // Handlers
    handleSort,
    handleSelectQuery,
    handleSelectProject,
    handleSelectAllQueries,
    handleSelectAllProjects,
    clearSelectedQueries,
    clearSelectedProjects,
    clearSearchTerm,
    resetState
  };
};

// edit to return string, not a promise 

/**
 * Hook to fetch resolved curie name using React Query
 * @param {string} curie - The curie string to resolve
 * @param {boolean} enabled - Whether the query should be enabled
 * @returns {data: string, isLoading: boolean} React Query result with resolved name
 */
export const useResolvedCurieName = (curie: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['curieName', curie],
    queryFn: () => fetcNodeNameFromCurie(curie),
    enabled: enabled && !!curie,
    staleTime: Infinity,
    retry: false,
  });
};

/**
 * Hook to get query card title with async curie name resolution
 * @param {UserQueryObject} query - The query object
 * @returns { title: string; isLoading: boolean } Object with title and loading state
 */
export const useGetQueryCardTitle = (query: UserQueryObject): { title: string; isLoading: boolean } => {
  const updateQueryMutation = useUpdateQuery();
  const baseTitle = useMemo(() => 
    query.data.title || generateQueryTitle(query), 
    [query]
  );
  
  const hasCurie = useMemo(() => 
    queryTitleHasCurie(baseTitle), 
    [baseTitle]
  );
  
  const { data: resolvedName, isLoading } = useResolvedCurieName(
    hasCurie || '', 
    !!hasCurie
  );
  
  const title = useMemo(() => {
    if (hasCurie && resolvedName) {
      const newTitle = baseTitle.replace(hasCurie, resolvedName);
      // call update query endpoint
      updateQueryMutation.mutate({
        id: query.sid,
        title: newTitle
      });
      return newTitle;
    }
    return baseTitle;
  }, [hasCurie, resolvedName, baseTitle]);
  
  return { title, isLoading };
};