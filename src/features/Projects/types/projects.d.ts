
export type ProjectCreate = {
  title: string;
  pks: string[];
}

export type ProjectUpdate = {
  id: number;
  title: string | null;
  pks: string[];
}

export type ProjectRaw = {
  id: number;
  title: string;
  qids: string[];
  time_created: Date;
  time_updated: Date;
  deleted: boolean;
}

export type Project = ProjectRaw & {
  bookmark_count: number;
  note_count: number;
}

export type QueryStatus = 'success' | 'running' | 'error';

export interface QueryStatusObject {
  status: QueryStatus,
  data: {
    qid: string,
    aras: string[],
    title: string,
    bookmark_ids: string[],
    note_count: number,
    time_created: Date, 
    time_updated: Date, 
    deleted: boolean
  }
}

export interface UserQueryObject {
  // save ID
  sid:          string,
  pk:           string,
  time_created: Date,
  time_updated: Date,
  title:        string,
  tag_ids:      string[],
  bookmark_ids: string[],
  deleted:      boolean
}

export type SortField = 'name' | 'lastSeen' | 'dateAdded' | 'bookmarks' | 'notes' | 'status';
export type SortDirection = 'asc' | 'desc';

export const isProjectRaw = (obj: unknown): obj is ProjectRaw => {
  if (typeof obj !== 'object' || obj === null) {
    console.warn('isProjectRaw: Object is not an object or is null', obj);
    return false;
  }
  
  if (!('id' in obj)) {
    console.warn('isProjectRaw: Missing "id" property', obj);
    return false;
  }
  
  if (!('title' in obj)) {
    console.warn('isProjectRaw: Missing "title" property', obj);
    return false;
  }
  
  if (!('qids' in obj)) {
    console.warn('isProjectRaw: Missing "qids" property', obj);
    return false;
  }
  
  if (!('time_created' in obj)) {
    console.warn('isProjectRaw: Missing "time_created" property', obj);
    return false;
  }
  
  if (!('time_updated' in obj)) {
    console.warn('isProjectRaw: Missing "time_updated" property', obj);
    return false;
  }
  
  if (!('deleted' in obj)) {
    console.warn('isProjectRaw: Missing "deleted" property', obj);
    return false;
  }
  
  return true;
};

export const isProject = (obj: unknown): obj is Project => {
  if (!isProjectRaw(obj)) {
    console.warn('isProject: Failed ProjectRaw validation', obj);
    return false;
  }
  
  if (!('bookmark_count' in obj)) {
    console.warn('isProject: Missing "bookmark_count" property', obj);
    return false;
  }
  
  if (!('note_count' in obj)) {
    console.warn('isProject: Missing "note_count" property', obj);
    return false;
  }
  
  return true;
};

export const isProjectArray = (obj: unknown): obj is Project[] => {
  if (!Array.isArray(obj)) {
    console.warn('isProjectArray: Object is not an array', obj);
    return false;
  }
  
  const invalidIndex = obj.findIndex(item => !isProject(item));
  if (invalidIndex !== -1) {
    console.warn(`isProjectArray: Item at index ${invalidIndex} failed Project validation`, obj[invalidIndex]);
    return false;
  }
  
  return true;
};

export const isProjectRawArray = (obj: unknown): obj is ProjectRaw[] => {
  if (!Array.isArray(obj)) {
    console.warn('isProjectRawArray: Object is not an array', obj);
    return false;
  }
  
  const invalidIndex = obj.findIndex(item => !isProjectRaw(item));
  if (invalidIndex !== -1) {
    console.warn(`isProjectRawArray: Item at index ${invalidIndex} failed ProjectRaw validation`, obj[invalidIndex]);
    return false;
  }
  
  return true;
};

export const isQueryStatusArray = (obj: unknown): obj is QueryStatusObject[] => {
  if (!Array.isArray(obj)) {
    console.warn('isQueryStatusArray: Object is not an array', obj);
    return false;
  }
  
  for (let i = 0; i < obj.length; i++) {
    const item = obj[i];
    
    if (typeof item !== 'object' || item === null) {
      console.warn(`isQueryStatusArray: Item at index ${i} is not an object or is null`, item);
      return false;
    }
    
    if (!('status' in item)) {
      console.warn(`isQueryStatusArray: Item at index ${i} missing "status" property`, item);
      return false;
    }
    
    if (!('data' in item)) {
      console.warn(`isQueryStatusArray: Item at index ${i} missing "data" property`, item);
      return false;
    }
    
    const data = (item as unknown).data;
    if (typeof data !== 'object' || data === null) {
      console.warn(`isQueryStatusArray: Item at index ${i} has invalid "data" property`, data);
      return false;
    }
    
    if (!('qid' in data)) {
      console.warn(`isQueryStatusArray: Item at index ${i} missing "data.qid" property`, data);
      return false;
    }
    
    if (!('aras' in data)) {
      console.warn(`isQueryStatusArray: Item at index ${i} missing "data.aras" property`, data);
      return false;
    }
    
    if (!('title' in data)) {
      console.warn(`isQueryStatusArray: Item at index ${i} missing "data.title" property`, data);
      return false;
    }
    
    if (!('bookmark_ids' in data)) {
      console.warn(`isQueryStatusArray: Item at index ${i} missing "data.bookmark_ids" property`, data);
      return false;
    }
    
    if (!('note_count' in data)) {
      console.warn(`isQueryStatusArray: Item at index ${i} missing "data.note_count" property`, data);
      return false;
    }
    
    if (!('time_created' in data)) {
      console.warn(`isQueryStatusArray: Item at index ${i} missing "data.time_created" property`, data);
      return false;
    }
    
    if (!('time_updated' in data)) {
      console.warn(`isQueryStatusArray: Item at index ${i} missing "data.time_updated" property`, data);
      return false;
    }
    
    if (!('deleted' in data)) {
      console.warn(`isQueryStatusArray: Item at index ${i} missing "data.deleted" property`, data);
      return false;
    }
  }
  
  return true;
};

export const isUserQueryObject = (obj: unknown): obj is UserQueryObject => {
  if (typeof obj !== 'object' || obj === null) {
    console.warn('isUserQueryObject: Object is not an object or is null', obj);
    return false;
  }
  
  if (!('queries' in obj)) {
    console.warn('isUserQueryObject: Missing "queries" property', obj);
    return false;
  }
  
  if (!Array.isArray((obj as unknown).queries)) {
    console.warn('isUserQueryObject: "queries" property is not an array', (obj as unknown).queries);
    return false;
  }
  
  return true;
};