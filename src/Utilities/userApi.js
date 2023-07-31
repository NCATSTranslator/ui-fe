import { get, post, put, remove } from './web';

export const getUserProfile = async (httpErrorHandler = defaultHttpErrorHandler,
                                     fetchErrorHandler = defaultFetchErrorHandler) => {
  return getUserData(`${userApiPath}`, httpErrorHandler, fetchErrorHandler);
}

export const getUserPreferences = async (httpErrorHandler = defaultHttpErrorHandler,
                                         fetchErrorHandler = defaultFetchErrorHandler) => {
  return getUserData(`${userApiPath}/preferences`, httpErrorHandler, fetchErrorHandler);
}

export const getAllUserSaves = async (doIncludeDeleted = false,
                                      httpErrorHandler = defaultHttpErrorHandler,
                                      fetchErrorHandler = defaultFetchErrorHandler) => {

  const qp = doIncludeDeleted ? '?include_deleted=true' : '';
  return getUserData(`${userApiPath}/saves${qp}`, httpErrorHandler, fetchErrorHandler);
}

export const getUserSave = async (saveId,
                                  httpErrorHandler = defaultHttpErrorHandler,
                                  fetchErrorHandler = defaultFetchErrorHandler) => {
  return getUserData(`${userApiPath}/saves/${saveId}`, httpErrorHandler, fetchErrorHandler);
}

export const updateUserPreferences = async (preferences,
                                            httpErrorHandler = defaultHttpErrorHandler, 
                                            fetchErrorHandler = defaultFetchErrorHandler) => {
  const body = { preferences: {} };
  Object.keys(preferences).forEach((pref) => {
    body.preferences[pref] = { pref_value: preferences[pref] };
  });

  return postUserData(`${userApiPath}/preferences`, body, httpErrorHandler, fetchErrorHandler);
}

export const createUserSave = async (saveObj,
                                     httpErrorHandler = defaultHttpErrorHandler,
                                     fetchErrorHandler = defaultFetchErrorHandler) => {
  return postUserData(`${userApiPath}/saves`, saveObj, httpErrorHandler, fetchErrorHandler);
}

export const updateUserSave = async (saveId,
                                     saveObj,
                                     httpErrorHandler = defaultHttpErrorHandler,
                                     fetchErrorHandler = defaultFetchErrorHandler) => {
  saveObj.id = saveId;
  return putUserData(`${userApiPath}/saves/${saveId}`, saveObj, httpErrorHandler, fetchErrorHandler);
}

export const deleteUserSave = async (saveId,
                                     httpErrorHandler = defaultHttpErrorHandler,
                                     fetchErrorHandler = defaultFetchErrorHandler) => {
  return deleteUserData(`${userApiPath}/saves/${saveId}`, httpErrorHandler, fetchErrorHandler);                                    
}                                    

const userApiPath = '/main/api/v1/pvt/users/me';
const fetchUserData = async (fetchMethod, httpErrorHandler, fetchErrorHandler) => {
  let resp = null;
  try {
    resp = await fetchMethod();
  } catch (fetchError) {
    fetchErrorHandler(fetchError);
  }

  if (!resp || !resp.ok) {
    httpErrorHandler(resp);
  } else {
    return resp.json();
  }
}

const defaultHttpErrorHandler = (resp) => {
  console.log('No error handler provided for HTTP error response');
  throw Error(resp.statusText);
}

const defaultFetchErrorHandler = (error) => {
  console.log('No error handler provided for fetch error');
  throw Error(error);
}

const getUserData = async (url, httpErrorHandler, fetchErrorHandler) => {
  return await fetchUserData(async () => await get(url), httpErrorHandler, fetchErrorHandler);
}

const postUserData = async (url, body, httpErrorHandler, fetchErrorHandler) => {
  return await fetchUserData(async () => await post(url, body), httpErrorHandler, fetchErrorHandler);
}

const putUserData = async (url, body, httpErrorHandler, fetchErrorHandler) => {
  return await fetchUserData(async () => await put(url, body), httpErrorHandler, fetchErrorHandler);
}

const deleteUserData = async (url, httpErrorHandler, fetchErrorHandler) => {
  return await fetchUserData(async () => await remove(url), httpErrorHandler, fetchErrorHandler);
}