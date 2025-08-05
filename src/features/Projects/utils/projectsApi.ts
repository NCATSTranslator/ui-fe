import { get, post, put, fetchWithErrorHandling, ErrorHandler } from '@/features/Common/utils/web';
import { isProjectRaw, isProjectRawArray, isQueryStatusArray, isUserQueryObject, ProjectCreate, ProjectUpdate, 
  QueryStatusObject, UserQueryObject, ProjectRaw, QueryUpdate} from '@/features/Projects/types/projects.d';

// Base API path prefix
export const API_PATH_PREFIX = '/api/v1';

/**
 * GET /api/v1/users/me/projects
 * Get all projects for the current user.
 */
export const getUserProjects = async (
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler
): Promise<ProjectRaw[]> => {
  const url = `${API_PATH_PREFIX}/users/me/projects?include_deleted=true`;
  
  return fetchWithErrorHandling<ProjectRaw[]>(
    () => get(url),
    httpErrorHandler,
    fetchErrorHandler,
    isProjectRawArray
  );
};

/**
 * GET /api/v1/users/me/queries/status
 * Get the query status for all queries associated with the current user.
 */
export const getUserQueryStatus = async (
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler
): Promise<QueryStatusObject[]> => {
  const url = `${API_PATH_PREFIX}/users/me/queries/status?include_deleted=true`;
  
  return fetchWithErrorHandling<QueryStatusObject[]>(
    () => get(url),
    httpErrorHandler,
    fetchErrorHandler,
    isQueryStatusArray
  );
};

/**
 * POST /api/v1/users/me/project
 * Creates a new project.
 */
export const createProject = async (
  projectData: ProjectCreate,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler
): Promise<ProjectRaw> => {
  const url = `${API_PATH_PREFIX}/users/me/projects`;
  
  return fetchWithErrorHandling<ProjectRaw>(
    () => post(url, projectData),
    httpErrorHandler,
    fetchErrorHandler,
    isProjectRaw
  );
};

/**
 * PUT /api/v1/users/me/projects/update
 * Update the projects in the body of the message.
 */
export const updateProjects = async (
  projects: ProjectUpdate[],
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler
): Promise<ProjectRaw> => {
  const url = `${API_PATH_PREFIX}/users/me/projects/update`;
  
  return fetchWithErrorHandling<ProjectRaw>(
    () => put(url, projects),
    httpErrorHandler,
    fetchErrorHandler,
    isProjectRaw
  );
};

/**
 * PUT /api/v1/users/me/projects/delete
 * Updates a list of project IDs by setting the deleted flag to true.
 */
export const deleteProjects = async (
  projectIds: string[],
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler
): Promise<ProjectRaw[]> => {
  const url = `${API_PATH_PREFIX}/users/me/projects/delete`;
  
  return fetchWithErrorHandling<ProjectRaw[]>(
    () => put(url, projectIds),
    httpErrorHandler,
    fetchErrorHandler,
    isProjectRawArray
  );
};

/**
 * PUT /api/v1/users/me/projects/restore
 * Updates a list of project IDs by setting the deleted flag to false.
 */
export const restoreProjects = async (
  projectIds: string[],
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler
): Promise<ProjectRaw[]> => {
  const url = `${API_PATH_PREFIX}/users/me/projects/restore`;
  
  return fetchWithErrorHandling<ProjectRaw[]>(
    () => put(url, projectIds),
    httpErrorHandler,
    fetchErrorHandler,
    isProjectRawArray
  );
};

/**
 * PUT /api/v1/users/me/queries/delete
 * Updates a list of query IDs by setting the deleted flag to true.
 */
export const deleteQueries = async (
  queryIds: string[],
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler
): Promise<UserQueryObject> => {
  const url = `${API_PATH_PREFIX}/users/me/queries/delete`;
  
  return fetchWithErrorHandling<UserQueryObject>(
    () => put(url, queryIds),
    httpErrorHandler,
    fetchErrorHandler,
    isUserQueryObject
  );
};

/**
 * PUT /api/v1/users/me/queries/restore
 * Updates a list of query IDs by setting the deleted flag to false.
 */
export const restoreQueries = async (
  queryIds: string[],
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler
): Promise<UserQueryObject> => {
  const url = `${API_PATH_PREFIX}/users/me/queries/restore`;
  
  return fetchWithErrorHandling<UserQueryObject>(
    () => put(url, queryIds),
    httpErrorHandler,
    fetchErrorHandler,
    isUserQueryObject
  );
};

/**
 * PUT /api/v1/users/me/queries/update
 * Update the queries in the body of the message.
 */
export const updateQueries = async (
  queries: QueryUpdate[],
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler
): Promise<UserQueryObject> => {
  const url = `${API_PATH_PREFIX}/users/me/queries/update`;
  
  return fetchWithErrorHandling<UserQueryObject>(
    () => put(url, queries),
    httpErrorHandler,
    fetchErrorHandler,
    isUserQueryObject
  );
};