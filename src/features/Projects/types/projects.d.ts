
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

export type SortValue = string | Date | number;