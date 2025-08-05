import { Project, QueryStatus, QueryStatusObject } from "@/features/Projects/types/projects.d";

/**
 * Get the status of a project based on the most recent query's status
 * @param project - The project to get the status of
 * @param queries - The queries to get the status from
 * @returns The status of the project
 */
export const getProjectStatus = (project: Project, queries: QueryStatusObject[]): QueryStatus => {
  // Get the most recent query's status
  const mostRecentQuery = project.data.pks.reduce((mostRecent: QueryStatusObject | null, qid) => {
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