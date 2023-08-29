import { cloneDeep } from 'lodash';
import { get, post, put, remove } from './web';

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
    pref_value: "sometimes",
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

export const emptyEditor = '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

export const getSaves = async (setUserSaves = undefined) => {
  let saves = await getAllUserSaves();
  saves = formatUserSaves(saves);

  if(setUserSaves !== undefined)
    setUserSaves(saves);
  
  return saves;
}

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

export const getFormattedBookmarkObject = (bookmarkType = "result", bookmarkName, notes = "", queryNodeID, queryNodeLabel = "",
  queryNodeDescription = "", typeObject, saveItem, pk) => {

  let newSaveItem = cloneDeep(saveItem);
  delete newSaveItem.evidence.publications;

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
    body.preferences[pref] = { pref_value: preferences[pref].pref_value };
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
  return await fetchUserData(async () => await remove(url), httpErrorHandler, fetchErrorHandler, () => true);
}

export const handleLogout = async (clientID, navigate) => {
  if(!clientID) {
    console.warn("No client id available from config endpoint, unable to log out.");
    return;
  }

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: {
      client_id: clientID,
      show_prompt: false
    }
  }
  await fetch('https://a-ci.ncats.io/_api/auth/transltr/session/end', requestOptions)
    .then((data) => {
        if(data.status === 200) {
          console.log("success", data);
          window.location.assign("/main/logout");
        } else {
          console.error("Logout unsuccessful. Response:", data);
        }
      }
    );
}