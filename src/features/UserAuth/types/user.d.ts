import { Example } from "@/features/Query/types/querySubmission";

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
  cached_queries: Example[];
  gaID: string;
  include_hashed_parameters: boolean;
  include_pathfinder: boolean;
  include_projects: boolean;
  include_query_status_polling: boolean;
  include_summarization: boolean;
  name_resolver: {endpoint: string};
  social_providers: Record<string, SocialProvider>;
}

export type SocialProvider = {
  auth_uri?: string;
  client_id: string;
  logout_uri?: string;
  redirect_uri: string;
  scope?: string;
  token_uri: string;
  user_data_uri?: string;
}

export type UserState = {
  currentUser?: User | null; 
  currentPrefs: PreferencesContainer;
  currentConfig: Config | null;
}

export const isConfig = (obj: unknown): obj is Config => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'gaID' in obj &&
    'name_resolver' in obj &&
    'social_providers' in obj &&
    'include_pathfinder' in obj &&
    'include_summarization' in obj &&
    'cached_queries' in obj
  );
};