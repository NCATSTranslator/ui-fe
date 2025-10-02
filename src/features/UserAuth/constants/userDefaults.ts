import { PreferencesContainer } from '@/features/UserAuth/types/user.d';

// Default user preferences for application settings such as result sorting and visibility options.
export const defaultPrefs: PreferencesContainer = {
  result_sort: {
    pref_value: "scoreHighLow",
    possible_values:["scoreHighLow", "scoreLowHigh", "nameLowHigh", "nameHighLow", "evidenceLowHigh", "evidenceHighLow"]
  },
  result_per_screen: {
    pref_value: 10,
    possible_values:[5, 10, 20]
  },
  graph_visibility: {
    pref_value: "never",
    possible_values:["always", "never", "sometimes"]
  },
  graph_layout: {
    pref_value: "vertical",
    possible_values:["vertical", "horizontal", "concentric"]
  },
  path_show_count: {
    pref_value: 10,
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
};

// A constant representing an empty editor state, used to initialize editors with no content.
export const emptyEditor = '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';
