import { getLookupResultsShareURLPath, getPathfinderResultsShareURLPath, getResultsShareURLPath } from "@/features/Core/utils/web";
import { Project, ProjectRaw, QueryStatus, UserQueryObject } from "@/features/Projects/types/projects.d";
import { AutocompleteItem } from "@/features/Query/types/querySubmission";
import { unableToReachLinkToast } from "@/features/Core/utils/toastMessages";
import { ARAStatusResponse } from "@/features/ResultList/types/results.d";
import { getFormattedNodeName } from '@/features/Core/utils/stringFormatters';

/**
 * Get the status of a project based on the most recent query's status
 * @param {Project} project - The project to get the status of
 * @param {UserQueryObject[]} queries - The queries to get the status from
 * @returns {QueryStatus} The status of the project
 */
export const getProjectStatus = (project: Project, queries: UserQueryObject[]): QueryStatus => {

  if(project.data.pks.length === 0)
    return 'noQueries';

  if(project.data.pks.every((qid) => queries.find((query) => query.data.qid === qid)?.status === 'noResults'))
    return 'noResults';

  // Get the most recent query's status
  const mostRecentQuery = project.data.pks.reduce((mostRecent: UserQueryObject | null, qid) => {
    const query = queries.find((query) => query.data.qid === qid);
    
    if (query?.status) {
      const queryTime = new Date(query.data.time_updated);
      const mostRecentTime = mostRecent ? new Date(mostRecent.data.time_updated) : new Date(0);
      
      if (queryTime > mostRecentTime)
        return query;
    }
    return mostRecent;
  }, null);

  return mostRecentQuery?.status || 'unknown';
}

/**
 * Get the type ID from the type and direction
 * @param {string} type - The type of the query
 * @param {string | null} direction - The direction of the query
 * @returns {number} The type ID
 */
export const getTypeIDFromType = (type: string, direction: string | null) => {
  switch(type) {
    case 'chemical': return direction === 'increased' ? 1 : 2;
    case 'gene': return direction === 'increased' ? 3 : 4;
    // default case is drug->disease type id
    default: return 0;
  }
}

/**
 * Get the additional queries that are not in the sorted data
 * @param {UserQueryObject[]} queries - The queries to get the additional queries from
 * @param {UserQueryObject[]} sortedQueries - The sorted queries
 * @returns {UserQueryObject[]} The additional queries
 */
export const getAdditionalQueries = (queries: UserQueryObject[], sortedQueries: UserQueryObject[] ) => {
  const sortedQueryIds = sortedQueries.filter((q) => !q.data.deleted).map((q) => q.data.qid);
  return queries.filter((query) => !sortedQueryIds.includes(query.data.qid) && !query.data.deleted);
}

/**
 * Get the subtitle for the project detail header
 * @param {Project | undefined} project - The project to get the subtitle for
 * @param {UserQueryObject[]} sortedQueries - The sorted queries
 * @returns {string} The subtitle for the project detail header
 */
export const getProjectDetailHeaderSubtitle = (project: Project | undefined, queries: UserQueryObject[]) => {
  const queryCount = getProjectQueryCount(project, queries);
  const queryCountText = queryCount === 1 ? 'Query' : 'Queries';
  return `${queryCount} ${queryCountText}`;
}

/**
 * Get the query count for the project
 * @param {Project} project - The project to get the query count for
 * @param {UserQueryObject[]} activeQueries - The active queries to get the query count from (deleted queries should be excluded)
 * @returns {number} The query count
 */
export const getProjectQueryCount = (project: Project | ProjectRaw | undefined, activeQueries: UserQueryObject[]) => {
  const projectPks = project?.data.pks || [];
  return projectPks.filter(pk => activeQueries.find(q => q.data.qid === pk)).length;
}

/**
 * Get the name of a node from a curie using the name resolver
 * @param {string} curie - The curie of the node
 * @param {AbortSignal | undefined} signal - The abort signal to cancel the fetch
 * @returns {string} The preferred name of the node
 */
export const fetchNodeNameFromCurie = async (curie: string, signal?: AbortSignal): Promise<string> => {
  const nameResolverEndpoint = 'https://name-resolution-sri.renci.org/synonyms';
  const response = await fetch(`${nameResolverEndpoint}?preferred_curies=${curie}`, { signal });
  const data = await response.json();
  return getFormattedNodeName(data[curie]?.preferred_name || undefined, null);
}

/**
 * Build an AutocompleteItem from a node id and optional label.
 */
const toAutocompleteItem = (id: string, label?: string | null): AutocompleteItem => ({
  id,
  label: label || id,
  isExact: false,
  score: 0,
});

/**
 * Get the share URL path for a query using the appropriate builder for its type.
 * @param {UserQueryObject} query - The query to get the path for
 * @param {string} resultID - The result ID (pass '0' for list-only links)
 * @param {boolean} shouldHash - Whether to hash the URL parameters
 * @returns {string | null} The share URL path, or null if required data is missing
 */
export const getQueryShareURLPath = (
  query: UserQueryObject,
  resultID = '0',
  shouldHash = false,
): string | null => {
  const { qid, query: queryData } = query.data;

  if (queryData.type === 'pathfinder' && queryData.subject && queryData.object) {
    if (!queryData.subject.id || !queryData.object.id) return null;
    return getPathfinderResultsShareURLPath({
      itemOne: toAutocompleteItem(queryData.subject.id, queryData.node_one_label),
      itemTwo: toAutocompleteItem(queryData.object.id, queryData.node_two_label),
      resultID,
      constraint: queryData.constraint || undefined,
      pk: qid,
      shouldHash,
    });
  }

  if (queryData.type === 'lookup' && queryData.subject) {
    if (!queryData.subject.id) return null;
    return getLookupResultsShareURLPath(
      toAutocompleteItem(queryData.subject.id, queryData.node_one_label),
      queryData.object?.category || '',
      resultID,
      qid,
      shouldHash,
    );
  }

  const curie = queryData.curie || '';
  return getResultsShareURLPath({
    label: queryData.node_one_label || curie,
    nodeID: curie,
    typeID: getTypeIDFromType(queryData.type, queryData.direction || null),
    resultID,
    pk: qid,
    shouldHash,
  });
};

/**
 * Get the link for a query
 * @param {UserQueryObject} query - The query to get the link for
 * @param {boolean} shouldHash - Whether to hash the URL parameters
 * @returns {string} The link for the query
 */
export const getQueryLink = (query: UserQueryObject, shouldHash = false) => {
  const path = getQueryShareURLPath(query, '0', shouldHash);
  if (!path) {
    unableToReachLinkToast();
    return '';
  }
  return encodeURI(`${window.location.origin}/${path}`);
};

/**
 * Get the percentage of the query status based on the number of ARAs returned and the total number of ARAs
 * @param {UserQueryObject | ARAStatusResponse} item - The query to get the percentage for
 * @returns {number} The percentage of the query status
 */
export const getQueryStatusPercentage = (item: UserQueryObject | ARAStatusResponse) => {
  const currentInterval = item.data.aras.length;
  const TOTAL_INTERVALS = 4;
  const initialPercentage = 5;
  const progressPercentage = ((currentInterval / TOTAL_INTERVALS) * 100) - initialPercentage;
  // If the query is complete, return 100%, otherwise return the progress percentage
  return item.status === 'complete' ? 100 : Math.max(initialPercentage, progressPercentage);
}

/**
 * Get the blank project title
 * @returns {string} The blank project title
 */
export const getBlankProjectTitle = (projects: Project[]) => {
  // Find all projects with "New Project" in their name and extract numbers
  const newProjectNumbers = projects
    .filter((project) => {
      const title = project.data.title.toLowerCase();
      return title.includes('new project');
    })
    .map((project) => {
      const title = project.data.title;
      // Match "New Project" followed by optional spaces and a number
      const match = title.match(/^new project\s+(\d+)$/i);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((num): num is number => num !== null);

  // If no valid "New Project X" projects found, return "New Project 1"
  if (newProjectNumbers.length === 0) {
    return 'New Project 1';
  }

  // Find the highest number and add 1
  const highestNumber = Math.max(...newProjectNumbers);
  return `New Project ${highestNumber + 1}`;
}

export const getQueryStatusIndicatorStatus = (
  arsStatus: ARAStatusResponse | null,
  isFetchingARAStatus: boolean,
  hasFreshResults: boolean,
  isFetchingResults: boolean,
  resultStatus: "error" | "running" | "success" | "unknown",
  resultCount: number
): { 
  label: 'Error' | 'New Results Available' | 'All Results Shown' | 'No Results' | 'Unknown' | '';
  status: 'complete' | 'running' | 'error' | 'unknown';
} => {
  // Error states take highest priority
  if(arsStatus?.status === 'error' || resultStatus === 'error' || (!isFetchingARAStatus && !isFetchingResults && arsStatus === null)) {
    return { label: 'Error', status: 'error' };
  }
  
  // Check for fresh results
  if(hasFreshResults) {
    if(arsStatus?.status === 'complete') {
      return { label: 'New Results Available', status: 'complete' };
    } else {
      return { label: 'New Results Available', status: 'running' };
    }
  }
  
  // Check if complete and all loaded
  if(arsStatus?.status === 'complete' && !isFetchingResults) {
    if(resultCount === 0) {
      return { label: 'No Results', status: 'unknown' };
    } else {
      return { label: 'All Results Shown', status: 'complete' };
    }
  }
  
  // Loading states
  if(isFetchingARAStatus || arsStatus?.status === 'running' || arsStatus === null || isFetchingResults) {
    return { label: '', status: 'running' };
  }
  
  // Default fallback
  return { label: '', status: 'unknown' };
}
