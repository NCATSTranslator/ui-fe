import { getPathfinderResultsShareURLPath, getResultsShareURLPath } from "@/features/Common/utils/web";
import { Project, ProjectRaw, QueryStatus, UserQueryObject } from "@/features/Projects/types/projects.d";
import { AutocompleteItem } from "@/features/Query/types/querySubmission";
import { queryTypes } from "@/features/Query/utils/queryTypes";
import { unableToReachLinkToast } from "@/features/Core/utils/toastMessages";
import { ARAStatusResponse } from "@/features/ResultList/types/results.d";
import { capitalizeFirstLetter } from "@/features/Common/utils/utilities";

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
 * Generates the title of a query based on the query type and direction
 * @param {UserQueryObject} query - The query to generate the title for
 * @returns {string} The title of the query
 */
export const generateQueryTitle = (query: UserQueryObject): string => {
  if(query.data.title)
    return query.data.title;

  let title = 'No title available';

  if(query.data.query.type === 'pathfinder') {
    // TODO: add constraint and nodes to title when Gus adds them to the query object
    const constraint = query.data.query.constraint || null;
    const nodeOne = query.data.query.node_one_label || query.data.query.subject?.id || 'nodeOne';
    const nodeTwo = query.data.query.node_two_label || query.data.query.object?.id || 'nodeTwo';

    title = constraint
      ? `${capitalizeFirstLetter(nodeOne)} and ${capitalizeFirstLetter(nodeTwo)} — ${capitalizeFirstLetter(constraint)} Connections`
      : `${capitalizeFirstLetter(nodeOne)} and ${capitalizeFirstLetter(nodeTwo)}`;
  } else {
    const queryType = queryTypes.find(type => type.targetType === query.data.query.type);
    const label = query.data.query.node_one_label || query.data.query.curie;
    if(queryType) {
      // TODO: update curie to node label when Gus adds it to the query object
      title = `${label} — ${capitalizeFirstLetter(queryType.targetType)}s`;
    }
  }

  return title;
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
 * @param {UserQueryObject[]} queries - The queries to get the query count from
 * @returns {number} The query count
 */
export const getProjectQueryCount = (project: Project | ProjectRaw | undefined, queries: UserQueryObject[]) => {
  const projectPks = project?.data.pks || [];
  return projectPks.filter(pk => !queries.find(q => q.data.qid === pk)?.data.deleted).length;
}

/**
 * Get the name of a node from a curie using the name resolver
 * @param {string} curie - The curie of the node
 * @returns {string} The preferred name of the node
 */
export const fetcNodeNameFromCurie = async (curie: string): Promise<string> => {
  const nameResolverEndpoint = 'https://name-resolution-sri.renci.org/synonyms';
  const response = await fetch(`${nameResolverEndpoint}?preferred_curies=${curie}`);
  const data = await response.json();
  return data[curie]?.preferred_name || '';
}

/**
 * Find all curies in the query title
 * @param {string} title - The title to check
 * @returns {string[]} Array of all curies found in the title
 */
export const findAllCuriesInTitle = (title: string): string[] => {
  const curieRegex = /\b[A-Za-z][A-Za-z0-9_]*:[A-Za-z0-9_-]+\b/g;
  const matches = title.match(curieRegex);
  return matches || [];
}

/**
 * Get the link for a query
 * @param {UserQueryObject} query - The query to get the link for
 * @returns {string} The link for the query
 */
export const getQueryLink = (query: UserQueryObject) => {
  const qid = query.data.qid;

  if(query.data.query.type === 'pathfinder' && query.data.query.subject && query.data.query.object) {
    if(!query.data.query.subject || !query.data.query.object) {
      unableToReachLinkToast();
      return "";
    }
    const itemOne: AutocompleteItem = {
      id: query.data.query.subject.id,
      label: query.data.query.node_one_label || query.data.query.subject.id,
      isExact: false,
      score: 0
    }
    const itemTwo: AutocompleteItem = {
      id: query.data.query.object.id,
      label: query.data.query.node_two_label || query.data.query.object.id,
      isExact: false,
      score: 0
    }
    const constraint = query.data.query.constraint || undefined;
    const path = getPathfinderResultsShareURLPath(itemOne, itemTwo, "0", constraint, qid);
    return encodeURI(`${window.location.origin}/${path}`);
  } else {
    const curie = query.data.query.curie || '';
    const label = query.data.query.node_one_label || curie|| '';
    const type = query.data.query.type;
    const direction = query.data.query.direction || null;
    const typeID = getTypeIDFromType(type, direction);
    const path = getResultsShareURLPath(label, curie, typeID, "0", qid);
    return encodeURI(`${window.location.origin}/${path}`);
  }
}

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