
// User Prefs
export type PrefObject = {
  pref_value: string | number;
  possible_values: string[] | number[];
  time_created?: string;
  time_updated?: string;
  pref_data_type?: string;
}

export type PreferencesContainer = {
  [key:string]: PrefObject;
  result_sort: PrefObject;
  result_per_screen: PrefObject;
  graph_visibility: PrefObject;
  graph_layout: PrefObject;
  path_show_count: PrefObject;
  evidence_sort: PrefObject;
  evidence_per_screen: PrefObject;
}

export type User = {
  data: null;
  deleted: boolean;
  email: string;
  id: string;
  name: string;
  profile_pic_url: string;
  time_created: string;
  time_updated: string;
}

export type Session = {
  auth_provider: string;
  id: number;
  linked_from: string | null;
  time_session_created: string;
  time_session_updated: string;
  time_token_created: string;
  token: string;
  user_id: string;
}
export type SessionStatus = {
  status: number;
  session: Session;
  user: User;
}

export type Config = {
  cached_queries: object[];
  gaID: string;
  name_resolver: string;
  social_providers: any;
}

export type RootState = {
  currentRoot: string;
  currentUser?: User | null; 
  currentPrefs: PreferencesContainer;
  currentConfig: Config | null;
}