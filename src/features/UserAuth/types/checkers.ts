import { checkProperties } from "@/features/Core/types/checkers";
import { Config } from "./user.d";

export const isConfig = (obj: unknown, warn = false): obj is Config => {
  if (typeof obj !== 'object' || obj === null) {
    if (warn) console.warn("[isConfig] expected object, got:", typeof obj, obj);
    return false;
  }
  const o = obj as Record<string, unknown>;
  return checkProperties("isConfig", obj, [
    // update this to check all properties of the Config type
    ["cached_queries", "cached_queries" in obj, "present", o.cached_queries],
    ["gaID", "gaID" in obj, "present", o.gaID],
    ["include_hashed_parameters", "include_hashed_parameters" in obj, "present", o.include_hashed_parameters],
    ["include_lookup", "include_lookup" in obj, "present", o.include_lookup],
    ["include_pathfinder", "include_pathfinder" in obj, "present", o.include_pathfinder],
    ["include_projects", "include_projects" in obj, "present", o.include_projects],
    ["include_query_status_polling", "include_query_status_polling" in obj, "present", o.include_query_status_polling],
    ["include_summarization", "include_summarization" in obj, "present", o.include_summarization],
    ["name_resolver", "name_resolver" in obj, "present", o.name_resolver],
    ["social_providers", "social_providers" in obj, "present", o.social_providers],
    ["show_novelty_boost", "show_novelty_boost" in obj, "present", o.show_novelty_boost],
  ], warn);
};
