import { Preferences } from '@/features/UserAuth/types/user';

/*
 *  Default user preferences for application settings such as result sorting and visibility options.
 *  Also referenced by formatPrefs function to set the name and possible values for each preference when fetched from the database.
 */
export const defaultPrefs: Preferences = {
  result_sort: {
    name: "Default Results Sorting",
    pref_value: "scoreHighLow",
    possible_values:["nameLowHigh", "nameHighLow", "evidenceLowHigh", "evidenceHighLow", "scoreHighLow", "scoreLowHigh", "pathHighLow", "pathLowHigh"]
  },
  results_per_page: {
    name: "Results Shown per Page",
    pref_value: 10,
    possible_values:[5, 10, 20]
  },
  graph_visibility: {
    name: "Graph Visibility",
    pref_value: "never",
    possible_values:["always", "never", "sometimes"]
  },
  graph_layout: {
    name: "Default Graph Layout",
    pref_value: "vertical",
    possible_values:["vertical", "horizontal", "concentric"]
  },
  path_show_count: {
    name: "Number of Paths to Show",
    pref_value: 10,
    possible_values:[5, 10, 20, -1]
  },
  evidence_sort: {
    name: "Default Evidence Sorting",
    pref_value: "dateHighLow",
    possible_values:["titleLowHigh", "titleHighLow", "sourceLowHigh", "sourceHighLow", "dateLowHigh", "dateHighLow"]
  },
  evidence_per_page: {
    name: "Default Publications Shown per Page",
    pref_value: 5,
    possible_values:[5, 10, 20, 50]
  },
};

// A constant representing an empty editor state, used to initialize editors with no content.
export const emptyEditor = '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';
