
import { Dispatch, SetStateAction } from 'react';

export type ProjectCreate = {
  title: string;
  pks: string[];
}

export type ProjectUpdate = {
  id: number;
  title: string | null;
  pks: string[];
}

export type QueryUpdate = {
  id: string;
  title: string;
}

export type ProjectRaw = {
  ars_pkey?: string | null;
  data: {
    pks: string[];
    title: string;
  }
  deleted: boolean;
  id: number;
  label?: string | null;
  notes?: string | null;
  object_ref?: string | null;
  save_type: "project";
  time_created: Date;
  time_updated: Date;
  user_id?: string | null;
}

export type Project = ProjectRaw & {
  bookmark_count: number;
  note_count: number;
}

export type QueryStatus = 'complete' | 'running' | 'error' | 'unknown' | 'noQueries' | 'noResults';

export type PathfinderNodeObject = {
  id: string,
  category: string,
}

export type QueryTypeString = 'drug' | 'gene' | 'chemical' | 'pathfinder';

export interface UserQueryObject {
  data: {
    aras: string[],
    bookmark_ids: string[],
    deleted: boolean
    note_count: number,
    qid: string,
    query: {
      constraint?: string | null,
      curie?: string,
      direction?: string | null,
      node_one_label?: string | null,
      node_two_label?: string | null,
      object?: PathfinderNodeObject,
      pid?: string | null,
      // category is biolink entity type
      subject?: PathfinderNodeObject,
      type: QueryTypeString
    },
    time_created: Date,
    time_updated: Date,
    title: string | null,
  }
  // save ID
  sid: string,
  status: QueryStatus,
}

export type SortField = 'name' | 'lastSeen' | 'queries' | 'bookmarks' | 'notes' | 'status' | 'queryType';
export type SortDirection = 'asc' | 'desc';

export interface SortSearchState {
  sortField: SortField;
  sortDirection: SortDirection;
  handleSort: (field: SortField) => void;
  searchTerm: string;
}

export type ProjectEditingItem = {
  id: string;
  name: string;
  queryIds?: string[];
  status?: 'new' | 'editing';
  type: 'project';
} | undefined;

export type QueryEditingItem = {
  pk: string;
  name: string;
  queryIds?: string[];
  status?: 'new' | 'editing';
  type: 'query';
} | undefined;

export type ModalType = 
  | 'deleteProjects'
  | 'deleteProject'
  | 'deleteQueries'
  | 'permanentDeleteProject'
  | 'permanentDeleteQuery'
  | 'permanentDeleteSelected'
  | 'emptyTrash'
  | 'shareQuery';

export type ModalObject = {
  [K in ModalType]?: boolean;
};

export type DataCardLocation = "list" | "detail" | "queries" | "trash";

export const isProjectRaw = (obj: unknown): obj is ProjectRaw => {
  if (typeof obj !== 'object' || obj === null) {
    console.warn('isProjectRaw: Object is not an object or is null', obj);
    return false;
  }
  
  if (!('id' in obj)) {
    console.warn('isProjectRaw: Missing "id" property', obj);
    return false;
  }
  
  if (!('data' in obj)) {
    console.warn('isProjectRaw: Missing "data" property', obj);
    return false;
  }
  
  const data = (obj as unknown).data;
  if (typeof data !== 'object' || data === null) {
    console.warn('isProjectRaw: "data" property is not an object or is null', data);
    return false;
  }
  
  if (!('pks' in data)) {
    console.warn('isProjectRaw: Missing "data.pks" property', data);
    return false;
  }
  
  if (!('title' in data)) {
    console.warn('isProjectRaw: Missing "data.title" property', data);
    return false;
  }
  
  if (!('deleted' in obj)) {
    console.warn('isProjectRaw: Missing "deleted" property', obj);
    return false;
  }
  
  if (!('save_type' in obj)) {
    console.warn('isProjectRaw: Missing "save_type" property', obj);
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

export const isUserQueryObjectArray = (obj: unknown): obj is UserQueryObject[] => {
  if (!Array.isArray(obj)) {
    console.warn('isUserQueryObjectArray: Object is not an array', obj);
    return false;
  }
  
  for (const item of obj) {
    if (!isUserQueryObject(item)) {
      console.warn('isUserQueryObjectArray: Item failed UserQueryObject validation', item);
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
  
  if (!('sid' in obj)) {
    console.warn('isUserQueryObject: Missing "sid" property', obj);
    return false;
  }

  if (!('status' in obj)) {
    console.warn('isUserQueryObject: Missing "status" property', obj);
    return false;
  }

  if (!('data' in obj)) {
    console.warn('isUserQueryObject: Missing "data" property', obj);
    return false;
  }

  const data = (obj as unknown).data;
  if (typeof data !== 'object' || data === null) {
    console.warn('isUserQueryObject: "data" property is not an object or is null', data);
    return false;
  }

  if (!('aras' in data)) {
    console.warn('isUserQueryObject: Missing "data.aras" property', data);
    return false;
  }

  if (!('bookmark_ids' in data)) {
    console.warn('isUserQueryObject: Missing "data.bookmark_ids" property', data);
    return false;
  }

  if (!('deleted' in data)) {
    console.warn('isUserQueryObject: Missing "data.deleted" property', data);
    return false;
  }

  if (!('note_count' in data)) {
    console.warn('isUserQueryObject: Missing "data.note_count" property', data);
    return false;
  }

  if (!('qid' in data)) {
    console.warn('isUserQueryObject: Missing "data.qid" property', data);
    return false;
  }

  if (!('query' in data)) {
    console.warn('isUserQueryObject: Missing "data.query" property', data);
    return false;
  }

  const query = data.query;
  if (typeof query !== 'object' || query === null) {
    console.warn('isUserQueryObject: "data.query" property is not an object or is null', query);
    return false;
  }

  if (!('type' in query)) {
    console.warn('isUserQueryObject: Missing "data.query.type" property', query);
    return false;
  }

  // Validate type is one of the allowed values
  const type = (query as unknown).type;
  if (typeof type !== 'string' || !['drug', 'gene', 'chemical', 'pathfinder'].includes(type)) {
    console.warn('isUserQueryObject: "data.query.type" must be one of: drug, gene, chemical, pathfinder', type);
    return false;
  }

  if (!('time_created' in data)) {
    console.warn('isUserQueryObject: Missing "data.time_created" property', data);
    return false;
  }

  if (!('time_updated' in data)) {
    console.warn('isUserQueryObject: Missing "data.time_updated" property', data);
    return false;
  }

  if (!('title' in data)) {
    console.warn('isUserQueryObject: Missing "data.title" property', data);
    return false;
  }
  
  return true;
};

export const isProjectUpdate = (obj: unknown): obj is ProjectUpdate => {
  if (typeof obj !== 'object' || obj === null) {
    console.warn('isProjectUpdate: Object is not an object or is null', obj);
    return false;
  }
  
  if (!('id' in obj)) {
    console.warn('isProjectUpdate: Missing "id" property', obj);
    return false;
  }

  if (!('title' in obj)) {
    console.warn('isProjectUpdate: Missing "title" property', obj);
    return false;
  }
  
  if (!('pks' in obj)) {
    console.warn('isProjectUpdate: Missing "pks" property', obj);
    return false;
  }
  
  return true;
};