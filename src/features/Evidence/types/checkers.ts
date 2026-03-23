import * as tc from "@/features/Common/types/checkers";
import { Provenance } from "./evidence";

export const isProvenance = (obj: unknown): obj is Provenance => {
  return (
    tc.isObject(obj) &&
    tc.isString(obj.infores) &&
    tc.isString(obj.knowledge_level) &&
    tc.isString(obj.name) &&
    tc.nullable(obj.url, tc.isString) &&
    tc.nullable(obj.wiki, tc.isString)
  );
}
