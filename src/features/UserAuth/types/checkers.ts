import { checkProperties } from "@/features/Common/types/checkers";
import { Config } from "./user.d";

export const isConfig = (obj: unknown, warn = false): obj is Config => {
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
