import { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';
import { get, post, put, remove, fetchWithErrorHandling } from '@/features/Common/utils/web';
import { QueryType } from '@/features/Query/types/querySubmission';
import { Path, Result, ResultBookmark, ResultEdge, ResultNode, ResultSet } from '@/features/ResultList/types/results';
import { Preferences, PreferencesContainer, PrefObject, SessionStatus, User, Config, isConfig } from '@/features/UserAuth/types/user.d';
import { setCurrentUser, setCurrentConfig, setCurrentPrefs } from '@/features/UserAuth/slices/userSlice';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { currentUser } from '@/features/UserAuth/slices/userSlice';
import { getEdgeById, getNodeById, getPathById, getPubById } from '@/features/ResultList/slices/resultsSlice';
import { PublicationObject } from '@/features/Evidence/types/evidence';
import { defaultPrefs } from '@/features/UserAuth/utils/userDefaults';

// Base API path prefix
export const API_PATH_PREFIX = '/api/v1';
// API path for user-related endpoints.
const userApiPath = `${API_PATH_PREFIX}/users/me`;

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


interface QueryObject {
  type: QueryType | null; 
  nodeId: number | string;
  nodeLabel: string;
  nodeDescription: string;
  pk: string;
  submitted_time: string; 
  resultSet: ResultSet;
}

export interface Save {
  id: number | string | null;
  label: string;
  user_id: string | null;
  save_type: string;
  notes: string;
  ars_pkey: string;
  object_ref: string;
  time_created: string | null;
  time_updated: string | null;
  data: {
    item: ResultBookmark;
    type: string;
    query: QueryObject;
  };
}

export interface SaveGroup {
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

    if(!Object.prototype.hasOwnProperty.call(newSaves, save.ars_pkey)) {
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
    Object.entries(newSaves).filter(([, value]) => {
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
 * @returns {Save} The formatted bookmark object.
 */
export const getFormattedBookmarkObject = (
    bookmarkType: string = "result",
    bookmarkName: string,
    notes: string = "",
    queryNodeID: number | string | undefined,
    queryNodeLabel: string = "",
    queryNodeDescription: string = "",
    typeObject: QueryType | null,
    saveItem: ResultBookmark,
    pk: string,
    resultSet: ResultSet
  ): Save => { 

    let queryObject = getQueryObjectForSave(queryNodeID, queryNodeLabel, queryNodeDescription, typeObject, pk, resultSet);
    return { 
      save_type: "bookmark", 
      label: bookmarkName, 
      notes: notes, 
      ars_pkey: pk, 
      object_ref: saveItem.id, 
      id: "",
      user_id: "",
      time_created: "",
      time_updated: "",
      data: {
        type: bookmarkType,
        query: queryObject,
        item: saveItem
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
    typeObject: QueryType | null, 
    pk: string,
    resultSet: ResultSet
  ): QueryObject => {
    return {
      type: typeObject, 
      nodeId: nodeID,
      nodeLabel: nodeLabel,
      nodeDescription: nodeDescription,
      pk: pk, 
      submitted_time: new Date().toString(),
      resultSet: resultSet
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
  ): Promise<PreferencesContainer> => {
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
 * @returns {Promise<Save>} The requested save data.
 */
export const getUserSave = async (
    saveId: string,
    httpErrorHandler: ErrorHandler = defaultHttpErrorHandler,
    fetchErrorHandler: ErrorHandler = defaultFetchErrorHandler
  ): Promise<Save> => {
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
    saveObj.id = parseInt(saveId);
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
 * @returns {Promise<T | void>} Processed response data.
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



type ErrorHandler = (error: Error) => void;
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
    const response = await fetchUserData<boolean>(
      async () => await remove(url), 
      httpErrorHandler, 
      fetchErrorHandler,
      async (resp: Response): Promise<boolean> => {
        return resp.ok;
      }
    );

    if(response === undefined || response === null) 
      throw new Error('Failed to delete user data.');
  
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

  useEffect(() => {
    if(!!sessionStatus) {
      dispatch(setCurrentUser(sessionStatus.user));
    }
  }, [sessionStatus, dispatch]);

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
export const useFetchConfigAndPrefs = (userFound: boolean | undefined,  setGaID: (id: string) => void, setGtmID: (id: string) => void) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchPrefs = async (hasUser: boolean) => {
      let formattedPrefs: Preferences | undefined;
      if(!hasUser) {
        formattedPrefs = defaultPrefs;
        console.warn("no user available, setting to default prefs.");
      } else {
        const prefs = await getUserPreferences(() => {
          console.warn("no prefs found for this user, setting to default prefs.");
        });
        console.log("initial fetch of user prefs: ", prefs);
        if(prefs === undefined) {
          formattedPrefs = defaultPrefs;
        } else {
          formattedPrefs = formatPrefs(prefs.preferences);
        }
      }
      if(!!formattedPrefs) 
        dispatch(setCurrentPrefs(formattedPrefs));
    };

    const fetchConfig = async () => {
      try {
        let config = await fetchWithErrorHandling<Config>(
          () => fetch(`${API_PATH_PREFIX}/config`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }),
          (error: Error) => console.warn("Failed to fetch config:", error.message),
          (error: Error) => console.warn("Fetch error while getting config:", error.message),
          isConfig
        );

        if(config?.gaID)
          setGaID(config.gaID);

        const configWithBuildInfo = {
          ...config,
          buildInfo: import.meta.env.VITE_BUILD_INFO
        };

        console.log("setting config", configWithBuildInfo);
        dispatch(setCurrentConfig(configWithBuildInfo as unknown as Config));
      } catch {
        console.warn("Config fetch failed, using default config");
        const defaultConfig: Config = {
          cached_queries: [],
          gaID: '',
          include_hashed_parameters: false,
          include_pathfinder: false,
          include_projects: false,
          include_query_status_polling: false,
          include_summarization: false,
          name_resolver: {endpoint: ''},
          social_providers: {},
        };
        dispatch(setCurrentConfig(defaultConfig));
      }
    };

    if(typeof userFound === 'boolean') {
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

export const formatPrefs = (prefs: Preferences) => {
  console.log("formatting prefs");
  let newPrefs: Preferences = cloneDeep(prefs);

  for(const key of Object.keys(prefs)) {
    newPrefs[key].name = getPrefName(key);
    newPrefs[key].possible_values = getPrefPossibleValues(key);
  }

  return newPrefs;
}

const getPrefPossibleValues = (key: string) => {
  return (!!defaultPrefs[key]) ? defaultPrefs[key].possible_values : [];
}

export const getPrefName = (key: string) => {
  return (!!defaultPrefs[key]) ? defaultPrefs[key].name : key;
}

const getAllPathsFromResult = (resultSet: ResultSet, result: Result) => {
  let paths: {[key: string]: Path} = {};

  for(const pathID of result.paths) {
    let path;
    let tempPathID = "";
    if(typeof pathID === "string") {
      path = getPathById(resultSet, pathID);
      tempPathID = pathID;
    } else {
      path = pathID;
      tempPathID = (!!path?.id) ? path.id : "";
    } 

    if(!!path) 
      paths[tempPathID] = path;
  }
  return paths;
}



const getAllNodesFromPath = (resultSet: ResultSet, path: Path, nodes: {[key: string]: ResultNode}) => {
  for (let i = 0; i < path.subgraph.length; i += 2) {
    const node = getNodeById(resultSet, path.subgraph[i]); 
    if(!!node)
      nodes[path.subgraph[i]] = node;
    else 
      console.warn(`Node with ID ${path.subgraph[i]} not found in resultSet.`);
    
  }
}
const getAllEdgesFromPath = (resultSet: ResultSet, path: Path, paths: {[key: string]: Path}, edges: {[key: string]: ResultEdge}, nodes: {[key: string]: ResultNode}) => {
  for (let i = 1; i < path.subgraph.length; i += 2) {
    const edge = getEdgeById(resultSet, path.subgraph[i]); 
    if(!!edge)
      edges[path.subgraph[i]] = edge;

    if(!!edge?.support) {
      for(const supPathID of edge.support) {
        const supPath = (typeof supPathID === "string") ? getPathById(resultSet, supPathID) : supPathID; 
        if(!!supPath) {
          const tempSupPathID = (typeof supPathID === "string") ? supPathID : (supPath.id) ? supPath.id : "";
          paths[tempSupPathID] = supPath;
          getAllEdgesFromPath(resultSet, supPath, paths, edges, nodes);
          getAllNodesFromPath(resultSet, supPath, nodes);
        }
      }
    }
  }
}
const getAllNodesAndEdgesFromPaths = (resultSet: ResultSet, paths: {[key: string]: Path}) => {
  let edges: {[key: string]: ResultEdge} = {};
  let nodes: {[key: string]: ResultNode} = {};

  for(const path of Object.values(paths)) {
    getAllEdgesFromPath(resultSet, path, paths, edges, nodes);
    getAllNodesFromPath(resultSet, path, nodes);
  }

  return {nodes: nodes, edges: edges};
}
const getAllPubsFromEdges = (resultSet: ResultSet, edges: ResultEdge[]) => {
  let pubs: {[key:string]: PublicationObject} = {};
  let resultPubIDs: Set<string> = new Set<string>();
  for(const edge of edges) 
    Object.values(edge.publications).map(pubArray => pubArray.map(pub => pub.id)).flat().forEach(id=>resultPubIDs.add(id));
  
  for(const pubID of resultPubIDs) {
    let pub = getPubById(resultSet, pubID);
    if(!!pub)
      pubs[pubID] = pub;
  }
  return pubs;
}

export const generateSafeResultSet = (resultSet: ResultSet, result: Result): ResultSet => {
  const allPaths = getAllPathsFromResult(resultSet, result);
  const allSubgraphItems = getAllNodesAndEdgesFromPaths(resultSet, allPaths);
  const allPubs = getAllPubsFromEdges(resultSet, Object.values(allSubgraphItems.edges));
  let newSave: ResultSet = {
    status: resultSet.status,
    data: {
      edges: allSubgraphItems.edges,
      errors: resultSet.data.errors,
      meta: resultSet.data.meta,
      nodes: allSubgraphItems.nodes,
      paths: allPaths,
      publications: allPubs,
      results: [result],
      tags: resultSet.data.tags,
      trials: resultSet.data.trials
    }
  }

  return newSave;
}

export const mergeResultSets = (resultSetOne: ResultSet, resultSetTwo: ResultSet) => {
  return {
    status: resultSetTwo.status,
    data: {
      edges: { ...resultSetOne.data.edges, ...resultSetTwo.data.edges },
      errors: {
        "biothings-annotator": [
          ...(resultSetOne.data.errors["biothings-annotator"] || []),
          ...(resultSetTwo.data.errors["biothings-annotator"] || []),
        ],
        unknown: [
          ...(resultSetOne.data.errors.unknown || []),
          ...(resultSetTwo.data.errors.unknown || []),
        ],
      },
      meta: {
        aras: [...new Set([...(resultSetOne.data.meta.aras || []), ...(resultSetTwo.data.meta.aras || [])])],
        qid: resultSetTwo.data.meta.qid || resultSetOne.data.meta.qid,
        timestamp: resultSetTwo.data.meta.timestamp || resultSetOne.data.meta.timestamp,
      },
      nodes: { ...resultSetOne.data.nodes, ...resultSetTwo.data.nodes },
      paths: { ...resultSetOne.data.paths, ...resultSetTwo.data.paths },
      publications: { ...resultSetOne.data.publications, ...resultSetTwo.data.publications },
      results: [...resultSetOne.data.results, ...resultSetTwo.data.results],
      tags: { ...resultSetOne.data.tags, ...resultSetTwo.data.tags },
      trials: { ...resultSetOne.data.trials, ...resultSetTwo.data.trials },
    },
  };
}

/**
 * Type guard to check if an object is a Preferences.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a Preferences, otherwise false.
 */
export const isPreferences = (obj: unknown): obj is Preferences => {
  let isPrefContainer;
  if (typeof obj !== 'object' || obj === null) {
    isPrefContainer = false;
  } else {
    const requiredKeys: Array<keyof Preferences> = [
      'result_sort',
      'result_per_screen',
      'graph_visibility',
      'graph_layout',
      'path_show_count',
      'evidence_sort',
      'evidence_per_screen',
    ];

    isPrefContainer = requiredKeys.every(key => key in obj && isPrefObject((obj as unknown as Record<string, unknown>)[key])) && Object.values(obj).every(isPrefObject);
  }
  if(!isPrefContainer)
    console.warn(`The following object does not match the typing for a PreferencesContainer:`, obj);

  return isPrefContainer;
};

/**
 * Type guard to check if an object is a PrefObject.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a PrefObject, otherwise false.
 */
const isPrefObject = (obj: unknown): obj is PrefObject => {
  const isAPrefObject =
    (
      typeof obj === 'object' &&
      obj !== null &&
      ('pref_value' in obj) &&
      (typeof obj.pref_value === 'string' || typeof obj.pref_value === 'number')
    );
  if(!isAPrefObject)
    console.warn(`The following object does not match the typing for PrefObject:`, obj);

  return isAPrefObject;
};