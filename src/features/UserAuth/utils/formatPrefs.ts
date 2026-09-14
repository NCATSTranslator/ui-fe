import { PrefKey, PrefObject, Preferences } from "@/features/UserAuth/types/user";
import cloneDeep from "lodash/cloneDeep";
import { defaultPrefs } from "@/features/UserAuth/utils/userDefaults";
import { capitalizeFirstLetter } from '@/features/Core/utils/stringFormatters';

const LEGACY_PREF_KEY_MAP: Record<string, PrefKey> = {
  results_per_screen: "results_per_page",
  result_per_screen: "results_per_page",
  evidence_per_screen: "evidence_per_page",
};

/** Removed prefs with no canonical successor — ignored on read. */
const DEPRECATED_PREF_KEYS = new Set(["graph_visibility"]);

const CANONICAL_PREF_KEYS = Object.keys(defaultPrefs) as PrefKey[];

const isPrefObject = (obj: unknown): obj is PrefObject =>
  typeof obj === "object" &&
  obj !== null &&
  "pref_value" in obj &&
  (typeof (obj as PrefObject).pref_value === "string" ||
    typeof (obj as PrefObject).pref_value === "number");

const ROOT_METADATA_KEYS = new Set(["user_id", "preferences"]);

/**
 * Normalizes API responses that may store prefs under `preferences`, at the root, or both.
 * Resolves legacy/deprecated keys so downstream consumers receive only canonical keys.
 */
export const parsePreferencesResponse = (response: unknown): Preferences | null => {
  if (!response || typeof response !== "object") return null;

  const raw = collectRawPrefs(response as Record<string, unknown>);

  const merged: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const canonicalKey = toCanonicalKey(key);
    if (!canonicalKey) {
      warnIgnoredPrefKey(key);
      continue;
    }
    if (!isPrefObject(value)) {
      console.warn(`Ignoring invalid preference for "${key}":`, value);
      continue;
    }
    if (canonicalKey !== key) {
      warnLegacyPrefKey(key, canonicalKey);
    }
    merged[canonicalKey] = value;
  }

  if (Object.keys(merged).length === 0) return null;

  return merged as Preferences;
};

/** Merges prefs nested under `preferences` with prefs stored at the response root. */
const collectRawPrefs = (record: Record<string, unknown>): Record<string, unknown> => {
  const raw: Record<string, unknown> = {};

  const nested = record.preferences;
  if (nested && typeof nested === "object" && nested !== null) {
    Object.assign(raw, nested);
  }

  for (const [key, value] of Object.entries(record)) {
    if (ROOT_METADATA_KEYS.has(key)) continue;
    raw[key] = value;
  }

  return raw;
};

const toCanonicalKey = (key: string): PrefKey | null => {
  if (DEPRECATED_PREF_KEYS.has(key)) return null;
  if (key in defaultPrefs) return key as PrefKey;
  if (key in LEGACY_PREF_KEY_MAP) return LEGACY_PREF_KEY_MAP[key];
  return null;
};

const warnIgnoredPrefKey = (key: string) => {
  if (DEPRECATED_PREF_KEYS.has(key)) {
    console.warn(`Ignoring deprecated preference key: "${key}"`);
  } else {
    console.warn(`Ignoring unknown preference key: "${key}"`);
  }
};

const warnLegacyPrefKey = (key: string, canonicalKey: PrefKey) => {
  console.warn(`Legacy preference key "${key}" mapped to "${canonicalKey}"`);
};

/**
 * Format the preferences object to the proper format. Expects a validated preferences object via parsePreferencesResponse.
 * @param {Preferences} prefs - The preferences object to format.
 * @returns {Preferences} The formatted preferences object.
 */
export const formatPrefs = (prefs: Preferences): Preferences => {
  const newPrefs = cloneDeep(defaultPrefs);

  for (const key of Object.keys(prefs)) {
    if (key in newPrefs && isPrefObject(prefs[key])) {
      const storedValue = prefs[key].pref_value;
      const allowed = newPrefs[key as PrefKey].possible_values as (string | number)[];
      newPrefs[key as PrefKey].pref_value = allowed.includes(storedValue)
        ? storedValue
        : defaultPrefs[key as PrefKey].pref_value;
    }
  }

  for (const key of CANONICAL_PREF_KEYS) {
    newPrefs[key].name = getPrefName(key);
    newPrefs[key].possible_values = getPrefPossibleValues(key);
  }

  return newPrefs;
};

const getPrefPossibleValues = (key: string) => {
  return (!!defaultPrefs[key]) ? defaultPrefs[key].possible_values : [];
};

export const getPrefName = (key: string) => {
  return (!!defaultPrefs[key]) ? defaultPrefs[key].name : key;
};

const PRETTY_PREF_VALUES = new Map<string | number, string>([
  ["scoreHighLow", "Confidence: High to Low"],
  ["scoreLowHigh", "Confidence: Low to High"],
  ["nameLowHigh", "Name: A to Z"],
  ["nameHighLow", "Name: Z to A"],
  ["evidenceLowHigh", "Evidence Count: Low to High"],
  ["evidenceHighLow", "Evidence Count: High to Low"],
  ["pathsHighLow", "Path Count: High to Low"],
  ["pathsLowHigh", "Path Count: Low to High"],
  // pref values used to use 'path' instead of 'paths', so we need to handle both
  ["pathHighLow", "Path Count: High to Low"],
  ["pathLowHigh", "Path Count: Low to High"],
  ["titleHighLow", "Title: A to Z"],
  ["titleLowHigh", "Title: Z to A"],
  ["sourceHighLow", "Source: A to Z"],
  ["sourceLowHigh", "Source: Z to A"],
  ["dateHighLow", "Date: New to Old"],
  ["dateLowHigh", "Date: Old to New"],
]);

export const getPrettyPrefValue = (value: string | number) =>
  PRETTY_PREF_VALUES.get(value) ?? capitalizeFirstLetter(value.toString());
