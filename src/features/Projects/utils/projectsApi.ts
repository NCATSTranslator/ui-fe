import { get, post, put, fetchWithErrorHandling, ErrorHandler } from '@/features/Common/utils/web';
import { isProject, isProjectArray, isQueryStatusArray, isUserQueryObject, Project, 
  ProjectCreate, ProjectUpdate, QueryStatusObject, UserQueryObject } from '@/features/Projects/types/projects.d';

// Base API path prefix
export const API_PATH_PREFIX = '/api/v1';

/**
 * GET /api/v1/users/me/projects
 * Get all projects for the current user.
 */
export const getUserProjects = async (
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler
): Promise<Project[]> => {
  const url = `${API_PATH_PREFIX}/users/me/projects`;
  
  return fetchWithErrorHandling<Project[]>(
    () => get(url),
    httpErrorHandler,
    fetchErrorHandler,
    isProjectArray
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
  const url = `${API_PATH_PREFIX}/users/me/queries/status`;
  
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
): Promise<Project> => {
  const url = `${API_PATH_PREFIX}/users/me/project`;
  
  return fetchWithErrorHandling<Project>(
    () => post(url, projectData),
    httpErrorHandler,
    fetchErrorHandler,
    isProject
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
): Promise<Project[]> => {
  const url = `${API_PATH_PREFIX}/users/me/projects/update`;
  
  return fetchWithErrorHandling<Project[]>(
    () => put(url, projects),
    httpErrorHandler,
    fetchErrorHandler,
    isProjectArray
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
): Promise<Project[]> => {
  const url = `${API_PATH_PREFIX}/users/me/projects/delete`;
  
  return fetchWithErrorHandling<Project[]>(
    () => put(url, projectIds),
    httpErrorHandler,
    fetchErrorHandler,
    isProjectArray
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
): Promise<Project[]> => {
  const url = `${API_PATH_PREFIX}/users/me/projects/restore`;
  
  return fetchWithErrorHandling<Project[]>(
    () => put(url, projectIds),
    httpErrorHandler,
    fetchErrorHandler,
    isProjectArray
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