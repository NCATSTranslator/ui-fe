import { cloneDeep } from 'lodash';
import { get, post, put, remove } from './web';

// Default user preferences for application settings such as result sorting and visibility options.
export const defaultPrefs = {
  result_sort: {
    pref_value: "scoreHighLow",
    possible_values:["scoreHighLow", "scoreLowHigh", "nameLowHigh", "nameHighLow", "evidenceLowHigh", "evidenceHighLow"]
  },
  result_per_screen: {
    pref_value: 10,
    possible_values:[5, 10, 20]
  },
  graph_visibility: {
    pref_value: "never",
    possible_values:["always", "never", "sometimes"]
  },
  graph_layout: {
    pref_value: "vertical",
    possible_values:["vertical", "horizontal", "concentric"]
  },
  path_show_count: {
    pref_value: 5,
    possible_values:[5, 10, 20, -1]
  },
  evidence_sort: {
    pref_value: "dateHighLow",
    possible_values:["titleLowHigh", "titleHighLow", "sourceLowHigh", "sourceHighLow", "dateLowHigh", "dateHighLow"]
  },
  evidence_per_screen: {
    pref_value: 5,
    possible_values:[5, 10, 20, 50]
  },
}

/**
 * Converts preference keys to user-friendly strings for display purposes.
 * 
 * @param {string} prefKey - The key of the preference to be converted.
 * @returns {string} The user-friendly string representation of the preference key.
 */
export const prefKeyToString = (prefKey) => {
  switch (prefKey) {
    case "result_sort":
      return "Sort results by";
    case "result_per_screen":
      return "Results to show per page";
    case "graph_visibility":
      return "Graph visibility";
    case "graph_layout":
      return "Graph layout";
    case "path_show_count":
      return "Number of paths to show";
    case "evidence_sort":
      return "Sort evidence by";
    case "evidence_per_screen":
      return "Publications to show per page";
    default: 
      return `No label provided for ${prefKey}`;
  }
}

// A constant representing an empty editor state, used to initialize editors with no content.
export const emptyEditor = '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

/**
 * Retrieves and optionally sets the current user's saved items via the provided callback.
 * 
 * @param {Function} [setUserSaves] - An optional setter function to update state with retrieved saves.
 * @returns {Promise<Object>} A promise that resolves to the formatted saves object.
 */
export const getSaves = async (setUserSaves = undefined) => {
  let saves = await getAllUserSaves();
  saves = formatUserSaves(saves);

  if(setUserSaves !== undefined)
    setUserSaves(saves);
  
  return saves;
}

/**
 * Formats an array of user saves into a more convenient structure.
 * 
 * @param {Array} saves - The array of save objects to format.
 * @returns {Object} The formatted saves, organized by primary key.
 */
const formatUserSaves = (saves) => { 
  let newSaves = {};
  for(const save of saves) {
    if(!save?.data?.query)
      continue;

    if(!newSaves.hasOwnProperty(save.ars_pkey)) {
      newSaves[save.ars_pkey] = {
        saves: new Set([save]),
        query: save.data.query
      };
    } else {
      newSaves[save.ars_pkey].saves.add(save);
    }
  }
  return newSaves;
}

/**
 * Constructs a save object for bookmarking based on the provided parameters
 * 
 * @param {string} [bookmarkType="result"] - The type of the bookmark (e.g., "result").
 * @param {string} bookmarkName - The name of the bookmark.
 * @param {string} [notes=""] - Additional notes associated with the bookmark.
 * @param {number} queryNodeID - The ID of the query node related to the bookmark.
 * @param {string} [queryNodeLabel=""] - The label of the query node.
 * @param {string} [queryNodeDescription=""] - The description of the query node.
 * @param {Object} typeObject - The type object associated with the bookmark.
 * @param {Object} saveItem - The item to be saved.
 * @param {string} pk - The primary key associated with the save.
 * @returns {Object} The formatted bookmark object.
 */
export const getFormattedBookmarkObject = (bookmarkType = "result", bookmarkName, notes = "", queryNodeID, queryNodeLabel = "",
  queryNodeDescription = "", typeObject, saveItem, pk) => {

  let newSaveItem = cloneDeep(saveItem);
  // delete newSaveItem.evidence.publications;

  let queryObject = getQueryObjectForSave(queryNodeID, queryNodeLabel, queryNodeDescription, typeObject, pk);
  return { 
    save_type: "bookmark", 
    label: bookmarkName, 
    notes: notes, 
    ars_pkey: pk, 
    object_ref: newSaveItem.id, 
    data: {
      type: bookmarkType,
      query: queryObject,
      item: newSaveItem
    }
  }
}

/**
 * Constructs a query object for saving, encapsulating node and type details.
 * 
 * @param {number} [nodeID=0] - The ID of the node related to the save.
 * @param {string} [nodeLabel=""] - The label of the node.
 * @param {string} [nodeDescription=""] - The description of the node.
 * @param {Object} typeObject - The type object for the save.
 * @param {string} pk - The primary key for the save.
 * @returns {Object} The constructed query object.
 */
export const getQueryObjectForSave = (nodeID = 0, nodeLabel = "", nodeDescription = "", typeObject, pk) => {
  return {
    type: typeObject, 
    nodeId: nodeID,
    nodeLabel: nodeLabel,
    nodeDescription: nodeDescription,
    pk: pk, 
    submitted_time: new Date() 
  }
}

/**
 * Fetches the current user's profile.
 * 
 * @param {Function} [httpErrorHandler=defaultHttpErrorHandler] - A handler function for HTTP errors.
 * @param {Function} [fetchErrorHandler=defaultFetchErrorHandler] - A handler function for fetch errors.
 * @returns {Promise<Object>} A promise that resolves to the user profile data.
 */
export const getUserProfile = async (httpErrorHandler = defaultHttpErrorHandler,
                                     fetchErrorHandler = defaultFetchErrorHandler) => {
  return getUserData(`${userApiPath}`, httpErrorHandler, fetchErrorHandler);
}

/**
 * Fetches the current user's preferences.
 * 
 * @param {Function} [httpErrorHandler=defaultHttpErrorHandler] - A handler function for HTTP errors.
 * @param {Function} [fetchErrorHandler=defaultFetchErrorHandler] - A handler function for fetch errors.
 * @returns {Promise<Object>} A promise that resolves to the user preferences data.
 */
export const getUserPreferences = async (httpErrorHandler = defaultHttpErrorHandler,
                                         fetchErrorHandler = defaultFetchErrorHandler) => {
  return getUserData(`${userApiPath}/preferences`, httpErrorHandler, fetchErrorHandler);
}

/**
 * Fetches all saves for the current user, with an option to include deleted saves.
 * 
 * @param {boolean} [doIncludeDeleted=false] - Whether to include deleted saves in the result.
 * @param {Function} [httpErrorHandler=defaultHttpErrorHandler] - A handler function for HTTP errors.
 * @param {Function} [fetchErrorHandler=defaultFetchErrorHandler] - A handler function for fetch errors.
 * @returns {Promise<Object>} A promise that resolves to the saves data.
 */
export const getAllUserSaves = async (doIncludeDeleted = false,
                                      httpErrorHandler = defaultHttpErrorHandler,
                                      fetchErrorHandler = defaultFetchErrorHandler) => {

  const qp = doIncludeDeleted ? '?include_deleted=true' : '';
  return getUserData(`${userApiPath}/saves${qp}`, httpErrorHandler, fetchErrorHandler);
}

/**
 * Fetches a specific save by ID for the current user.
 * 
 * @param {string} saveId - The ID of the save to fetch.
 * @param {Function} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {Function} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<Object>} The requested save data.
 */
export const getUserSave = async (saveId,
                                  httpErrorHandler = defaultHttpErrorHandler,
                                  fetchErrorHandler = defaultFetchErrorHandler) => {
  return getUserData(`${userApiPath}/saves/${saveId}`, httpErrorHandler, fetchErrorHandler);
}

/**
 * Updates the current user's preferences.
 * 
 * @param {Object} preferences - The new preferences to be updated.
 * @param {Function} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {Function} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<boolean>} Indicates success or failure of the update operation.
 */
export const updateUserPreferences = async (preferences,
                                            httpErrorHandler = defaultHttpErrorHandler, 
                                            fetchErrorHandler = defaultFetchErrorHandler) => {
  const body = { preferences: {} };
  Object.keys(preferences).forEach((pref) => {
    body.preferences[pref] = { pref_value: preferences[pref].pref_value };
  });

  return postUserData(`${userApiPath}/preferences`, body, httpErrorHandler, fetchErrorHandler);
}

/**
 * Creates a new save for the current user.
 * 
 * @param {Object} saveObj - The object containing the save data.
 * @param {Function} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {Function} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<boolean>} Indicates success or failure of the save operation.
 */
export const createUserSave = async (saveObj,
                                     httpErrorHandler = defaultHttpErrorHandler,
                                     fetchErrorHandler = defaultFetchErrorHandler) => {
  return postUserData(`${userApiPath}/saves`, saveObj, httpErrorHandler, fetchErrorHandler);
}

/**
 * Updates a specific save for the current user by save ID, handling any HTTP or fetch errors.
 * 
 * @param {string} saveId - The ID of the save to be updated.
 * @param {Object} saveObj - The updated save data.
 * @param {Function} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {Function} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<boolean>} Indicates success or failure of the update operation.
 */
export const updateUserSave = async (saveId,
                                     saveObj,
                                     httpErrorHandler = defaultHttpErrorHandler,
                                     fetchErrorHandler = defaultFetchErrorHandler) => {
  saveObj.id = saveId;
  return putUserData(`${userApiPath}/saves/${saveId}`, saveObj, httpErrorHandler, fetchErrorHandler);
}

/**
 * Deletes a specific save for the current user by save ID, handling any HTTP or fetch errors.
 * 
 * @param {string} saveId - The ID of the save to be deleted.
 * @param {Function} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {Function} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<boolean>} Indicates success or failure of the deletion operation.
 */
export const deleteUserSave = async (saveId,
                                     httpErrorHandler = defaultHttpErrorHandler,
                                     fetchErrorHandler = defaultFetchErrorHandler) => {
  return deleteUserData(`${userApiPath}/saves/${saveId}`, httpErrorHandler, fetchErrorHandler);                                    
}                                    

// Base API path for user-related endpoints.
const userApiPath = '/main/api/v1/pvt/users/me';

/**
 * Executes a fetch operation and processes the response.
 * 
 * @param {Function} fetchMethod - Function that performs the fetch operation.
 * @param {Function} httpErrorHandler - Handles HTTP errors.
 * @param {Function} fetchErrorHandler - Handles fetch errors.
 * @param {Function} successHandler - Processes successful responses, defaults to JSON parsing.
 * @returns {Promise<any>} Processed response data.
 */
const fetchUserData = async (fetchMethod,
                             httpErrorHandler,
                             fetchErrorHandler,
                             successHandler = (resp) => resp.json()) => {
  let resp = null;
  try {
    resp = await fetchMethod();
  } catch (fetchError) {
    fetchErrorHandler(fetchError);
  }

  if (!resp || !resp.ok) {
    httpErrorHandler(resp);
  } else {
    return successHandler(resp);
  }
}

/**
 * Default handler for HTTP errors. Logs a message for an HTTP error and throws an error with the response status text.
 * 
 * @param {Response} resp - The response object.
 */
const defaultHttpErrorHandler = (resp) => {
  console.log('No error handler provided for HTTP error response');
  throw Error(resp.statusText);
}

/**
 * Default handler for fetch operation errors. Logs a message for a fetch operation error and throws an error with the fetch error message.
 * 
 * @param {Error} error - The error object.
 */
const defaultFetchErrorHandler = (error) => {
  console.log('No error handler provided for fetch error');
  throw Error(error);
}

/**
 * Fetches user data from a specified URL.
 * 
 * @param {string} url - Endpoint URL.
 * @param {Function} httpErrorHandler - Handles HTTP errors.
 * @param {Function} fetchErrorHandler - Handles fetch errors.
 * @returns {Promise<Object>} User data as a JSON object.
 */
const getUserData = async (url, httpErrorHandler, fetchErrorHandler) => {
  return await fetchUserData(async () => await get(url), httpErrorHandler, fetchErrorHandler);
}

/**
 * Posts user data to a specified URL.
 * 
 * @param {string} url - Endpoint URL.
 * @param {Object} body - Payload for the request body.
 * @param {Function} httpErrorHandler - Handles HTTP errors.
 * @param {Function} fetchErrorHandler - Handles fetch errors.
 * @returns {Promise<Object>} Response data.
 */
const postUserData = async (url, body, httpErrorHandler, fetchErrorHandler) => {
  return await fetchUserData(async () => await post(url, body), httpErrorHandler, fetchErrorHandler);
}

/**
 * Updates user data at a specified URL via PUT request.
 * 
 * @param {string} url - Endpoint URL.
 * @param {Object} body - Payload for the request body.
 * @param {Function} httpErrorHandler - Handles HTTP errors.
 * @param {Function} fetchErrorHandler - Handles fetch errors.
 * @returns {Promise<Object>} Response data.
 */
const putUserData = async (url, body, httpErrorHandler, fetchErrorHandler) => {
  return await fetchUserData(async () => await put(url, body), httpErrorHandler, fetchErrorHandler);
}

/**
 * Deletes user data at a specified URL.
 * 
 * @param {string} url - Endpoint URL.
 * @param {Function} httpErrorHandler - Handles HTTP errors.
 * @param {Function} fetchErrorHandler - Handles fetch errors.
 * @returns {Promise<boolean>} Indicates success of deletion.
 */
const deleteUserData = async (url, httpErrorHandler, fetchErrorHandler) => {
  return await fetchUserData(async () => await remove(url), httpErrorHandler, fetchErrorHandler, () => true);
}