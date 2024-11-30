import { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';
import { get, post, put, remove } from './web';
import { QueryType } from '../Types/querySubmission';
import { ResultItem } from '../Types/results';
import { PreferencesContainer, SessionStatus } from '../Types/global';
import { setCurrentUser, setCurrentConfig, setCurrentPrefs } from '../Redux/rootSlice';
import { handleFetchErrors, isPreferencesContainer } from './utilities';
import { useDispatch } from 'react-redux';
import { User } from '../Types/global';
import { useSelector } from 'react-redux';
import { currentUser } from "../Redux/rootSlice";

// Base API path prefix
export const API_PATH_PREFIX = '/api/v1';
// API path for user-related endpoints.
const userApiPath = `${API_PATH_PREFIX}/users/me`;

// Default user preferences for application settings such as result sorting and visibility options.
export const defaultPrefs: PreferencesContainer = {
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
    pref_value: 10,
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

export interface Save {
  id: number | string | null;
  label: string | null;
  user_id: string | null;
  save_type: string;
  notes: string | null;
  ars_pkey: string;
  object_ref: string | null;
  time_created: string | null;
  time_updated: string | null;
  data?: {
    item?: ResultItem | Object;
    type?: string;
    query?: QueryObject;
  };
}

interface SaveGroup {
  saves: Set<Save>;
  query: QueryObject;
}

type SetUserSavesFunction = (e: { [key: string]: SaveGroup }) => void;

/**
 * Retrieves and optionally sets the current user's saved items via the provided callback.
 *
 * @param {Function} [setUserSaves] - An optional setter function to update state with retrieved saves.
 * @returns {Promise<Object>} A promise that resolves to the formatted saves object.
 */
export const getSaves = async (
    setUserSaves: SetUserSavesFunction | undefined = () => {}
  ): Promise<{ [key: string]: SaveGroup }> => {
    let saves = await getAllUserSaves();
    const formattedSaves = formatUserSaves(saves);

    if(setUserSaves !== undefined) {
      setUserSaves(formattedSaves);
    }

    return formattedSaves;
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
 * @param {PreferencesContainer} preferences - The new preferences to be updated.
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<boolean>} Indicates success or failure of the update operation.
 */
export const updateUserPreferences = async (
    preferences: PreferencesContainer,
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
  ) => {
    const body = { preferences: cloneDeep(preferences) };
    return postUserData(`${userApiPath}/preferences`, body, httpErrorHandler, fetchErrorHandler);
}

/**
 * Creates and submits and edge view save for the current user.
 *
 * @param {string} id - The ID of the edge.
 * @param {string} status - The status for the edge. Can be one of [approved | rejected]
 * @param {string} pk - The primary key associated with the save.
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Promise<any>} A promise representing the submission of the save.
 */
export const createUserEdgeView = async (
  id: string,
  status: string,
  pk: string,
  httpErrorHandler = defaultHttpErrorHandler,
  fetchErrorHandler = defaultFetchErrorHandler
): Promise<any> => {
  const save = genSave("eview", pk, genEdgeView(id, status));
  return createUserSave(save, httpErrorHandler, fetchErrorHandler);
}

//export const getUserEdgeViews = async (
//  httpErrorHandler = defaultHttpErrorHandler,
//  fetchErrorHandler = defaultFetchErrorHanalder
//): null => {
//  // TODO
//}

/**
 * Creates a result bookmark for the current user.
 *
 * @param {string} bookmarkName - The name of the bookmark.
 * @param {number} queryNodeID - The ID of the query node related to the bookmark.
 * @param {string} [queryNodeLabel=""] - The label of the query node.
 * @param {string} [queryNodeDescription=""] - The description of the query node.
 * @param {Object} typeObject - The type object associated with the bookmark.
 * @param {Object} saveItem - The item to be saved.
 * @param {string} pk - The primary key associated with the save.
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Object} The formatted bookmark object.
 */
export const createUserResultBookmark = async (
    bookmarkName: string,
    queryNodeID: number | string | undefined,
    queryNodeLabel: string = "",
    queryNodeDescription: string = "",
    typeObject: QueryType,
    saveItem: any,
    pk: string,
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
): Promise<any> => {
  return createUserBookmark("result", bookmarkName, "", queryNodeID, queryNodeLabel, queryNodeDescription,
    typeObject, saveItem, pk, httpErrorHandler, fetchErrorHandler);
}

/**
 * Creates a bookmark for the current user.
 *
 * @param {string} bookmarkType - The type of the bookmark (e.g., "result").
 * @param {string} bookmarkName - The name of the bookmark.
 * @param {string} [notes=""] - Additional notes associated with the bookmark.
 * @param {number} queryNodeID - The ID of the query node related to the bookmark.
 * @param {string} [queryNodeLabel=""] - The label of the query node.
 * @param {string} [queryNodeDescription=""] - The description of the query node.
 * @param {Object} typeObject - The type object associated with the bookmark.
 * @param {Object} saveItem - The item to be saved.
 * @param {string} pk - The primary key associated with the save.
 * @param {ErrorHandler} [httpErrorHandler=defaultHttpErrorHandler] - Custom handler for HTTP errors.
 * @param {ErrorHandler} [fetchErrorHandler=defaultFetchErrorHandler] - Custom handler for fetch errors.
 * @returns {Object} The formatted bookmark object.
 */
export const createUserBookmark = async (
    bookmarkType: string,
    bookmarkName: string,
    notes: string = "",
    queryNodeID: number | string | undefined,
    queryNodeLabel: string = "",
    queryNodeDescription: string = "",
    typeObject: QueryType,
    saveItem: any,
    pk: string,
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
  ): Promise<any> => {
    const bookmark = genFormattedBookmark(bookmarkType, bookmarkName, notes, queryNodeID,
      queryNodeLabel, queryNodeDescription, typeObject, saveItem, pk);
    console.log(bookmark);
    return createUserSave(bookmark, httpErrorHandler, fetchErrorHandler);
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
      if(!resp.ok) {
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

  if(response === undefined)
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
  ) => {
  const response = await fetchUserData<Response>(async () => await post(url, body), httpErrorHandler, fetchErrorHandler);

  if(response === undefined || response === null)
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

    if(response === undefined || response === null)
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

    if(response === undefined || response === null)
      throw new Error('Failed to put user data.');

    return response;
}



/* ========== AUTH REFACTOR ========== */


/**
 * Function to fetch the session status from the specified endpoint.
 *
 * @param {string} method - The HTTP method to use ('GET' or 'POST').
 * @param {boolean} [expire] - Optional parameter to indicate if the session should expire.
 * @param {boolean} [refresh] - Optional parameter to indicate if the session should refresh.
 * @returns {Promise<SessionStatus>} The session status data.
 * @throws {Error} If the request fails or the response is not ok.
 */
const fetchSessionStatus = async (method: 'GET' | 'POST', expire?: boolean, update?: boolean): Promise<SessionStatus> => {
  const ENDPOINT = `${API_PATH_PREFIX}/session/status`;
  try {
    let response: Response;

    if(method === 'POST') {
      let payload = null;
      if(!!expire) {
        payload = {expire: true};
      } else if(!!update) {
        payload = {update: true};
      }

      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } else {
      response = await fetch(ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if(!response.ok) {
      throw new Error(`Unable to retrieve session status. Error: ${response.status}`);
    }

    const data: SessionStatus = await response.json();
    return data;
  } catch (err) {
    if(err instanceof Error) {
      throw new Error(`Unable to retrieve session status. Error: ${err.message}`);
    } else {
      throw new Error(`Unable to retrieve session status. Unknown error.`);
    }
  }
};

/**
 * Custom hook to fetch session status using the specified method.
 *
 * @param {string} method - The HTTP method to use ('GET' or 'POST').
 * @param {boolean} [expire] - Optional parameter to indicate if the session should expire.
 * @param {boolean} [refresh] - Optional parameter to indicate if the session should refresh.
 * @returns {[SessionStatus | null, boolean, string | null]} The session status, loading state, and error state.
 */
const useSessionStatus = (method: 'GET' | 'POST', expire?: boolean, refresh?: boolean): [SessionStatus | null, boolean, string | null] => {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  if(!!sessionStatus) {
    dispatch(setCurrentUser(sessionStatus.user));
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchSessionStatus(method, expire, refresh);
        setSessionStatus(data);
      } catch (err) {
        if(err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [method, expire, refresh]);

  return [sessionStatus, loading, error];
};

/**
 * Custom hook to fetch session status using GET method.
 *
 * @returns {[SessionStatus | null, boolean, string | null]} The session status, loading state, and error state.
 */
export const useGetSessionStatus = (): [SessionStatus | null, boolean, string | null] => {
  return useSessionStatus('GET');
};

/**
 * Custom hook to fetch session status using POST method with optional expire and refresh parameters.
 *
 * @param {boolean} [expire] - Optional parameter to indicate if the session should expire.
 * @param {boolean} [refresh] - Optional parameter to indicate if the session should refresh.
 * @returns {[SessionStatus | null, boolean, string | null]} The session status, loading state, and error state.
 */
export const usePostSessionStatus = (expire?: boolean, refresh?: boolean): [SessionStatus | null, boolean, string | null] => {
  return useSessionStatus('POST', expire, refresh);
};

/**
 * Custom hook to fetch user preferences and configuration data, then dispatch them to the Redux store.
 *
 * This hook performs two asynchronous operations:
 * 1. Fetches user preferences and dispatches them to the Redux store.
 *    - If no preferences are found, it uses default preferences.
 * 2. Fetches configuration data from a specified endpoint and dispatches it to the Redux store.
 *    - Sets the Google Analytics ID (gaID) and Google Tag Manager ID (gtmID) if they are present in the config.
 *
 * The hook accepts two functions as arguments to set the gaID and gtmID in the component state.
 * It uses the `useEffect` hook to perform the data fetching on component mount and re-fetches if the dependencies change.
 *
 * @param {function} setGaID - Function to set the Google Analytics ID.
 * @param {function} setGtmID - Function to set the Google Tag Manager ID.
 */
export const useFetchConfigAndPrefs = (userFound: boolean,  setGaID: (id: string) => void, setGtmID: (id: string) => void) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchPrefs = async (hasUser: boolean) => {
      let prefs: any;
      if(!hasUser) {
        prefs = defaultPrefs;
        console.warn("no user available, setting to default prefs.");
      } else {
        prefs = await getUserPreferences(() => {
          console.warn("no prefs found for this user, setting to default prefs.");
        });
        console.log("initial fetch of user prefs: ", prefs);
        if(prefs === undefined) {
          prefs = defaultPrefs;
        }
      }
      if(isPreferencesContainer(prefs.preferences))
        dispatch(setCurrentPrefs(prefs.preferences));
    };

    const fetchConfig = async () => {
      const requestOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      };
      let config = await fetch(`${API_PATH_PREFIX}/config`, requestOptions)
        .then(response => handleFetchErrors(response))
        .then(response => response.json());

      if(config?.gaID) {
        setGaID(config.gaID);
      }
      if(config?.gtmID) {
        setGtmID(config.gtmID);
      }
      config.buildInfo = import.meta.env.VITE_BUILD_INFO;

      console.log("setting config", config);
      dispatch(setCurrentConfig(config));
    };

    if(userFound !== undefined) {
      fetchConfig();
      fetchPrefs(userFound);
    }
  }, [dispatch, setGaID, setGtmID, userFound]);
};

/**
 * Custom hook to retrieve the current user from the Redux store. Also provides a loading state.
 *
 * @returns {Object} An object containing the user (User | null | undefined) and loading state (boolean).
 */
export const useUser = (): [ user: User | null | undefined, loading: boolean ] => {
  const [loading, setLoading] = useState(true);
  const user = useSelector(currentUser);

  useEffect(() => {
    if (user !== undefined)
      setLoading(false);

  }, [user]);

  return [ user, loading ];
};

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
  // return only saves from after Jan 1, 2024
  const cutoffDate = new Date('2024-01-01');
  const filteredSaves = Object.fromEntries(
    Object.entries(newSaves).filter(([key, value]) => {
      return new Date(value.query.submitted_time) >= cutoffDate;
    })
  );
  return filteredSaves;
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
const genFormattedBookmark = (
    bookmarkType: string = "result",
    bookmarkName: string,
    notes: string = "",
    queryNodeID: number | string | undefined,
    queryNodeLabel: string = "",
    queryNodeDescription: string = "",
    typeObject: QueryType,
    saveItem: any,
    pk: string
  ): any => {

    let newSaveItem = cloneDeep(saveItem);
    // delete newSaveItem.evidence.publications;

    let queryObject = genQuery(queryNodeID, queryNodeLabel, queryNodeDescription, typeObject, pk);
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
 * Constructs an edge view
 *
 * @param {string} id - The ID for the edge.
 * @param {string} status - The status for the edge. Can be one of [approved | rejected]
 * @return {Object} - The edge view
 */
const genEdgeView = (
  id: string,
  status: string
): Object => {
  return {
    id: id,
    status: status
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
const genQuery = (
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
 * Constructs a generic save object
 *
 * @param {string} saveType - The type of save object.
 * @param {string} pk - The primary key associated with the object.
 * @param {Object} data - The data associated with the save object.
 * @param {string} [label=null] - A custom label for the save object.
 * @param {string} [notes=null] - Notes associated with the save object.
 * @param {string} [objectRef=null] - A path reference to the data.
 * @returns {Save} The constructed Save.
 */
const genSave = (
  saveType: string,
  pk: string,
  data: Object,
  label: string | null = null,
  notes: string | null = null,
  objectRef: string | null = null,
): Save => {
  return {
    id: null,
    label: label,
    user_id: null,
    save_type: saveType,
    ars_pkey: pk,
    notes: notes,
    object_ref: objectRef,
    time_created: null,
    time_updated: null,
    data: data
  }
}
