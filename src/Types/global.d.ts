
// User Prefs
type PrefObject = {
  pref_value: string | number;
  possible_values: string[] | number[];
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
  id: string;
  name: string;
  email: string;
  time_created: string;
  time_updated: string;
  profile_pic_url: string;
  data: object | null;
  deleted: boolean;
}

export type Config = {
  cached_queries: object[];
  gaID: string;
  name_resolver: string;
  socialProviders: object;
}

export type RootState = {
  currentRoot: string;
  currentUser: User | null; 
  currentPrefs: PreferencesContainer;
  currentConfig: Config | null;
}