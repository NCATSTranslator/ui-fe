import { Preferences } from "@/features/UserAuth/types/user";
import { cloneDeep } from "lodash";
import { defaultPrefs } from "@/features/UserAuth/utils/userDefaults";
import { capitalizeFirstLetter } from "@/features/Common/utils/utilities";

export const formatPrefs = (prefs: Preferences) => {
  let newPrefs: Preferences = cloneDeep(prefs);

  for(const key of Object.keys(prefs)) {
    const checkedKey = checkOldPrefKey(key);
    if(!newPrefs[checkedKey])
      newPrefs[checkedKey] = { name: "", pref_value: prefs[key].pref_value, possible_values: [] };

    newPrefs[checkedKey].name = getPrefName(checkedKey);
    newPrefs[checkedKey].possible_values = getPrefPossibleValues(checkedKey);
  }

  return newPrefs;
}

const checkOldPrefKey = (key: string) => {
  if(key === "results_per_screen" || key === "result_per_screen") return "results_per_page";
  if(key === "evidence_per_screen") return "evidence_per_page";
  return key;
}

const getPrefPossibleValues = (key: string) => {
  return (!!defaultPrefs[key]) ? defaultPrefs[key].possible_values : [];
}

export const getPrefName = (key: string) => {
  return (!!defaultPrefs[key]) ? defaultPrefs[key].name : key;
}

export const getPrettyPrefValue = (value: string | number) => {
  if(value === -1) return "All";

  switch(value) {
    case "scoreHighLow":
      return "Score (High to Low)";
    case "scoreLowHigh":
      return "Score (Low to High)";
    case "nameLowHigh":
      return "Name (A to Z)";
    case "nameHighLow":
      return "Name (Z to A)";
    case "evidenceLowHigh":
      return "Evidence Count (Low to High)";
    case "evidenceHighLow":
      return "Evidence Count (High to Low)";
    case "pathHighLow":
      return "Path Count (High to Low)";
    case "pathLowHigh":
      return "Path Count (Low to High)";
    case "titleHighLow":
      return "Title (A to Z)";
    case "titleLowHigh":
      return "Title (Z to A)";
    case "sourceHighLow":
      return "Source (A to Z)";
    case "sourceLowHigh":
      return "Source (Z to A)";
    case "dateHighLow":
      return "Date (New to Old)";
    case "dateLowHigh":
      return "Date (Old to New)";
    default:
      return capitalizeFirstLetter(value.toString());
  }

}