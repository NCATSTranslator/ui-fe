import * as tc from "@/features/Common/types/checkers";
import { Provenance } from "./evidence";

export const isProvenance = (obj: unknown, warn = true): obj is Provenance => {
  if (!tc.isObject(obj)) {
    if (warn) console.warn("[isProvenance] expected object, got:", typeof obj, obj);
    return false;
  }
  return tc.checkProperties("isProvenance", obj, [
    ["infores", tc.isString(obj.infores), "string", obj.infores],
    ["knowledge_level", tc.isString(obj.knowledge_level), "string", obj.knowledge_level],
    ["name", tc.isString(obj.name), "string", obj.name],
    ["notes", tc.nullable(obj.notes, tc.isString), "string | null", obj.notes],
    ["status", tc.nullable(obj.status, tc.isString), "string | null", obj.status],
    ["url", tc.nullable(obj.url, tc.isString), "string | null", obj.url],
    ["wiki", tc.nullable(obj.wiki, tc.isString), "string | null", obj.wiki],
  ], warn);
}
