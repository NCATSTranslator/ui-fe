import { Example } from "@/features/Query/types/querySubmission";
import { checkProperties } from "@/features/Common/types/checkers";

// User Prefs
export type PrefObject = {
  name?: string;
  pref_value: string | number;
  possible_values: string[] | number[];
  time_created?: string;
  time_updated?: string;
  pref_data_type?: string;
}

export type PreferencesContainer = {
  user_id: string;
  preferences: Preferences;
}

export type Preferences = {
  [key:string]: PrefObject;
  result_sort: PrefObject;
  results_per_page: PrefObject;
  graph_visibility: PrefObject;
  graph_layout: PrefObject;
  path_show_count: PrefObject;
  evidence_sort: PrefObject;
  evidence_per_page: PrefObject;
}

export type PrefType = "results" | "evidence" | "graphs";
export type PrefKey = "result_sort" | "results_per_page" | "graph_visibility" | "graph_layout" 
| "path_show_count" | "evidence_sort" | "evidence_per_page";

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
  name_resolver: {
    endpoint: string;
  };
  social_providers: Record<string, SocialProvider>;
  show_novelty_boost: boolean;
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
  currentPrefs: Preferences;
  currentConfig: Config | null;
}

export const isConfig = (obj: unknown, warn = true): obj is Config => {
  if (typeof obj !== 'object' || obj === null) {
    if (warn) console.warn("[isConfig] expected object, got:", typeof obj, obj);
    return false;
  }
  const o = obj as Record<string, unknown>;
  return checkProperties("isConfig", obj, [
    ["gaID", "gaID" in obj, "present", o.gaID],
    ["name_resolver", "name_resolver" in obj, "present", o.name_resolver],
    ["social_providers", "social_providers" in obj, "present", o.social_providers],
    ["include_pathfinder", "include_pathfinder" in obj, "present", o.include_pathfinder],
    ["include_summarization", "include_summarization" in obj, "present", o.include_summarization],
    ["cached_queries", "cached_queries" in obj, "present", o.cached_queries],
  ], warn);
};
