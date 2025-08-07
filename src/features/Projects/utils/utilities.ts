import { Project, QueryStatus, UserQueryObject } from "@/features/Projects/types/projects.d";
import { queryTypes } from "@/features/Query/utils/queryTypes";

/**
 * Get the status of a project based on the most recent query's status
 * @param {Project} project - The project to get the status of
 * @param {UserQueryObject[]} queries - The queries to get the status from
 * @returns {QueryStatus} The status of the project
 */
export const getProjectStatus = (project: Project, queries: UserQueryObject[]): QueryStatus => {
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

  return mostRecentQuery?.status || 'error';
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
      ? `What paths begin with ${nodeOne} and end with ${nodeTwo} and include a ${constraint}?`
      : `What paths begin with ${nodeOne} and end with ${nodeTwo}?`;
  } else {
    const queryType = queryTypes.find(type => type.targetType === query.data.query.type);
    const label = query.data.query.node_one_label || query.data.query.curie;
    if(queryType) {
      // TODO: update curie to node label when Gus adds it to the query object
      title = `${queryType.label.replaceAll("a disease?", "").replaceAll("a chemical?", "").replaceAll("a gene?", "")} ${label}?`;
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