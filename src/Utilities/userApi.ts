import { cloneDeep } from 'lodash';
import { get, post, put, remove } from './web';
import { QueryType } from './queryTypes';
import { ResultItem } from '../Types/results';
import { Preferences } from '../Types/global';


// Default user preferences for application settings such as result sorting and visibility options.
export const defaultPrefs: Preferences = {
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
export const prefKeyToString = (prefKey: string): string => {
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

interface QueryObject {
  type: QueryType; 
  nodeId: number | string;
  nodeLabel: string;
  nodeDescription: string;
  pk: string;
  submitted_time: Date; 
}

interface Save {
  id: number | string | null;
  label: string;
  user_id: string | null;
  save_type: string;
  notes: string;
  ars_pkey: string;
  object_ref: string;
  time_created: string | null;
  time_updated: string | null;
  data?: {
    item?: ResultItem;
    type?: string;
    query?: QueryObject;
  };
}

interface SaveGroup {
  saves: Set<Save>;
  query: object;
}

type SetUserSavesFunction = (e: { [key: string]: SaveGroup }) => void;

/**
 * Retrieves and optionally sets the current user's saved items via the provided callback.
 * 
 * @param {Function} [setUserSaves] - An optional setter function to update state with retrieved saves.
 * @returns {Promise<Object>} A promise that resolves to the formatted saves object.
 */
export const getSaves = async (
    setUserSaves: SetUserSavesFunction | undefined = () => console.log("no setter function available to set user saves.")
  ): Promise<{ [key: string]: SaveGroup }> => {
    let saves = await getAllUserSaves();
    const formattedSaves = formatUserSaves(saves);

    if(setUserSaves !== undefined) {
      setUserSaves(formattedSaves);
    }
    
    return formattedSaves;
}

/**
 * Formats an array of user saves into a more convenient structure.
 * 
 * @param {Array} saves - The array of save objects to format.
 * @returns {Object} The formatted saves, organized by primary key.
 */
const formatUserSaves = (saves: Save[]): { [key: string]: SaveGroup } => {
  let newSaves: { [key: string]: SaveGroup } = {};
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
export const getFormattedBookmarkObject = (
    bookmarkType: string = "result",
    bookmarkName: string,
    notes: string = "",
    queryNodeID: number | string | undefined,
    queryNodeLabel: string = "",
    queryNodeDescription: string = "",
    typeObject: QueryType,
    // fix this , needs type
    saveItem: any,
    pk: string
  ): Save => { 

    let newSaveItem = cloneDeep(saveItem);
    // delete newSaveItem.evidence.publications;

    let queryObject = getQueryObjectForSave(queryNodeID, queryNodeLabel, queryNodeDescription, typeObject, pk);
    return { 
      id: null,
      user_id: null,
      time_created: null,
      time_updated: null,
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
export const getQueryObjectForSave = (
    nodeID: number | string = 0, 
    nodeLabel: string = "", 
    nodeDescription: string = "", 
    typeObject: QueryType, 
    pk: string
  ): QueryObject => {
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
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - A handler function for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - A handler function for fetch errors.
 * @returns {Promise<Object>} A promise that resolves to the user profile data.
 */
export const getUserProfile = async (
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
  ) => {
    return getUserData(`${userApiPath}`, httpErrorHandler, fetchErrorHandler);
}

/**
 * Fetches the current user's preferences.
 * 
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - A handler function for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - A handler function for fetch errors.
 * @returns {Promise<Object>} A promise that resolves to the user preferences data.
 */
export const getUserPreferences = async (
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
  ) => {
    return getUserData(`${userApiPath}/preferences`, httpErrorHandler, fetchErrorHandler);
}

/**
 * Fetches all saves for the current user, with an option to include deleted saves.
 * 
 * @param {boolean} [doIncludeDeleted=false] - Whether to include deleted saves in the result.
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - A handler function for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - A handler function for fetch errors.
 * @returns {Promise<Object>} A promise that resolves to the saves data.
 */
export const getAllUserSaves = async (
    doIncludeDeleted: boolean = false,
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
  ): Promise<Save[]>  => {
    const qp = doIncludeDeleted ? '?include_deleted=true' : '';
    return getUserData(`${userApiPath}/saves${qp}`, httpErrorHandler, fetchErrorHandler);
}

/**
 * Fetches a specific save by ID for the current user.
 * 
 * @param {string} saveId - The ID of the save to fetch.
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<Object>} The requested save data.
 */
export const getUserSave = async (
    saveId: string,
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
  ) => {
    return getUserData(`${userApiPath}/saves/${saveId}`, httpErrorHandler, fetchErrorHandler);
}

/**
 * Updates the current user's preferences.
 * 
 * @param {Preferences} preferences - The new preferences to be updated.
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<boolean>} Indicates success or failure of the update operation.
 */
export const updateUserPreferences = async (
    preferences: Preferences,
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler, 
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
  ) => {
    const body = { preferences: cloneDeep(preferences) };
    return postUserData(`${userApiPath}/preferences`, body, httpErrorHandler, fetchErrorHandler);
}

/**
 * Creates a new save for the current user.
 * 
 * @param {Object} saveObj - The object containing the save data.
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<boolean>} Indicates success or failure of the save operation.
 */
export const createUserSave = async (
    saveObj: Save,
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
    // fix this, add return type
  ) => {
    return postUserData(`${userApiPath}/saves`, saveObj, httpErrorHandler, fetchErrorHandler);
}

/**
 * Updates a specific save for the current user by save ID, handling any HTTP or fetch errors.
 * 
 * @param {string} saveId - The ID of the save to be updated.
 * @param {Object} saveObj - The updated save data.
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<boolean>} Indicates success or failure of the update operation.
 */
export const updateUserSave = async (
    saveId: string,
    saveObj: Save,
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
  ) => {
    saveObj.id = saveId;
    return putUserData(`${userApiPath}/saves/${saveId}`, saveObj, httpErrorHandler, fetchErrorHandler);
}

/**
 * Deletes a specific save for the current user by save ID, handling any HTTP or fetch errors.
 * 
 * @param {string} saveId - The ID of the save to be deleted.
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<boolean>} Indicates success or failure of the deletion operation.
 */
export const deleteUserSave = async (
    saveId: string,
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
  ) => {
    return deleteUserData(`${userApiPath}/saves/${saveId}`, httpErrorHandler, fetchErrorHandler);                                    
}                                    

// Base API path for user-related endpoints.
const userApiPath = '/main/api/v1/pvt/users/me';

/**
 * Executes a fetch operation and processes the response.
 * 
 * @param {Function} fetchMethod - Function that performs the fetch operation.
 * @param {ErrorHandler} httpErrorHandler - Handles HTTP errors.
 * @param {ErrorHandler} fetchErrorHandler - Handles fetch errors.
 * @param {Function} successHandler - Processes successful responses, defaults to JSON parsing.
 * @returns {Promise<any>} Processed response data.
 */
const fetchUserData = async <T>(
    fetchMethod: () => Promise<Response>,
    httpErrorHandler: ErrorHandler,
    fetchErrorHandler: ErrorHandler,
    successHandler: SuccessHandler<T> = (resp: Response): Promise<T> => resp.json() as Promise<T>
  ): Promise<T | void> => {
    try {
      const resp = await fetchMethod();
      
      if (!resp.ok) { 
        httpErrorHandler(new Error(`HTTP Error: ${resp.statusText}`));
      } else {
        return successHandler(resp);
      }
    } catch (fetchError) {
      fetchErrorHandler(fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
    }
};



type ErrorHandler = (error: Error) => void | any;
type SuccessHandler<T> = (response: Response) => Promise<T>;
/**
 * Default handler for HTTP errors. Logs a message for an HTTP error and throws an error with the response status text.
 * 
 * @param {Error} error - The error object.
 */
const defaultHttpErrorHandler = (error: Error): void => {
  console.log('No error handler provided for HTTP error response');
  throw error;
};

/**
 * Default handler for fetch operation errors. Logs a message for a fetch operation error and throws an error with the fetch error message.
 * 
 * @param {Error} error - The error object.
 */
const defaultFetchErrorHandler = (error: Error): void => {
  console.log('No error handler provided for fetch error');
  throw error;
}

/**
 * Fetches user data from a specified URL.
 * 
 * @param {string} url - Endpoint URL.
 * @param {ErrorHandler} httpErrorHandler - Handles HTTP errors.
 * @param {ErrorHandler} fetchErrorHandler - Handles fetch errors.
 * @returns {Promise<Response>} User data as a JSON object.
 */
const getUserData = async <T>(
    url: string, 
    httpErrorHandler: ErrorHandler, 
    fetchErrorHandler: ErrorHandler
  ): Promise<T> => {
  const response = await fetchUserData<T>(() => get(url), httpErrorHandler, fetchErrorHandler);

  if (response === undefined) 
    throw new Error('Failed to fetch user data.');

  return response;
};

/**
 * Posts user data to a specified URL.
 * 
 * @param {string} url - Endpoint URL.
 * @param {RequestBodyType} body - Payload for the request body.
 * @param {ErrorHandler} httpErrorHandler - Handles HTTP errors.
 * @param {ErrorHandler} fetchErrorHandler - Handles fetch errors.
 * @returns {Promise<Response>} Response data.
 */
const postUserData = async <RequestBodyType>(
    url: string, 
    body: RequestBodyType, 
    httpErrorHandler: 
    ErrorHandler, fetchErrorHandler: ErrorHandler
    // fix this, add return type
  ) => {
  const response = await fetchUserData<Response>(async () => await post(url, body), httpErrorHandler, fetchErrorHandler);

  if (response === undefined || response === null) 
    throw new Error('Failed to post user data.');

  return response;
}

/**
 * Updates user data at a specified URL via PUT request.
 * 
 * @param {string} url - Endpoint URL.
 * @param {RequestBodyType} body - Payload for the request body.
 * @param {ErrorHandler} httpErrorHandler - Handles HTTP errors.
 * @param {ErrorHandler} fetchErrorHandler - Handles fetch errors.
 * @returns {Promise<Response>} Response data.
 */
const putUserData = async <RequestBodyType>(
    url: string, 
    body: RequestBodyType, 
    httpErrorHandler: 
    ErrorHandler, fetchErrorHandler: ErrorHandler
  ): Promise<Response> => {
    const response = await fetchUserData<Response>(async () => await put(url, body), httpErrorHandler, fetchErrorHandler);

    if (response === undefined || response === null) 
      throw new Error('Failed to put user data.');
  
    return response;
}

/**
 * Deletes user data at a specified URL.
 * 
 * @param {string} url - Endpoint URL.
 * @param {ErrorHandler} httpErrorHandler - Handles HTTP errors.
 * @param {ErrorHandler} fetchErrorHandler - Handles fetch errors.
 * @returns {Promise<boolean>} Indicates success of deletion.
 */
const deleteUserData = async (
    url: string, 
    httpErrorHandler: ErrorHandler, 
    fetchErrorHandler: ErrorHandler
  ): Promise<boolean> => {
    const response = await fetchUserData<Promise<boolean>>(async () => await remove(url), httpErrorHandler, fetchErrorHandler);

    if (response === undefined || response === null) 
      throw new Error('Failed to put user data.');
  
    return response;
}