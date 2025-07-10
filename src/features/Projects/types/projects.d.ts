
export type ProjectCreate = {
  title: string;
  pks: string[];
}

export type ProjectUpdate = {
  id: string;
  title: string | null;
  pks: string[];
}

export type Project = {
  id: string;
  title: string;
  qids: string[];
  time_created: Date;
  time_updated: Date;
  deleted: boolean;
}

export interface QueryStatusObject {
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

export const isProject = (obj: unknown): obj is Project => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'qids' in obj &&
    'time_created' in obj &&
    'time_updated' in obj &&
    'deleted' in obj
  );
};

export const isProjectArray = (obj: unknown): obj is Project[] => {
  return Array.isArray(obj) && obj.every(isProject);
};

export const isQueryStatusArray = (obj: unknown): obj is QueryStatusObject[] => {
  return Array.isArray(obj) && obj.every(item => 
    typeof item === 'object' &&
    item !== null &&
    'sid' in item &&
    'status' in item &&
    'timestamp' in item
  );
};

export const isUserQueryObject = (obj: unknown): obj is UserQueryObject => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'queries' in obj &&
    Array.isArray((obj as any).queries)
  );
};