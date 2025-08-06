import { Project, QueryStatus, UserQueryObject } from "@/features/Projects/types/projects.d";
import { queryTypes } from "@/features/Query/utils/queryTypes";

/**
 * Get the status of a project based on the most recent query's status
 * @param project - The project to get the status of
 * @param queries - The queries to get the status from
 * @returns The status of the project
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

export const generateQueryTitle = (query: UserQueryObject): string => {
  if(query.data.title)
    return query.data.title;

  let title = 'No title available';

  if(query.data.query.type === 'pathfinder') {
    // TODO: add constraint and nodes to title when Gus adds them to the query object
    const constraint = 'constraint'
    const nodeOne = 'nodeOne';
    const nodeTwo = 'nodeTwo';

    title = `What paths begin with ${nodeOne} and end with ${nodeTwo} and include a ${constraint}?`;
  } else {
    const curie = query.data.query.curie;
    const queryType = queryTypes.find(type => type.targetType === query.data.query.type);
    if(queryType) {
      // TODO: update curie to node label when Gus adds it to the query object
      title = `${queryType.label.replaceAll("a disease?", "").replaceAll("a chemical?", "").replaceAll("a gene?", "")} ${curie}?`;
    }
  }

  return title;
}