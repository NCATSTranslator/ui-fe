import { isObject } from "@/features/Common/types/checkers";
import { checkProperties } from "@/features/Common/types/checkers";
import { ProjectRaw, Project, UserQueryObject, ProjectUpdate } from "./projects.d";

export const isProjectRaw = (obj: unknown, warn = false): obj is ProjectRaw => {
  if (!isObject(obj)) {
    if (warn) console.warn("[isProjectRaw] expected object, got:", typeof obj, obj);
    return false;
  }
  if (!checkProperties("isProjectRaw", obj, [
    ["id", "id" in obj, "present", obj.id],
    ["data", isObject(obj.data), "object", obj.data],
    ["deleted", "deleted" in obj, "present", obj.deleted],
    ["save_type", "save_type" in obj, "present", obj.save_type],
    ["time_created", "time_created" in obj, "present", obj.time_created],
    ["time_updated", "time_updated" in obj, "present", obj.time_updated],
  ], warn)) return false;

  const data = obj.data as Record<string, unknown>;
  return checkProperties("isProjectRaw.data", data, [
    ["pks", "pks" in data, "present", data.pks],
    ["title", "title" in data, "present", data.title],
  ], warn);
};

export const isProject = (obj: unknown, warn = false): obj is Project => {
  if (!isProjectRaw(obj, warn)) return false;
  return checkProperties("isProject", obj, [
    ["bookmark_count", "bookmark_count" in obj, "present", (obj as Record<string, unknown>).bookmark_count],
    ["note_count", "note_count" in obj, "present", (obj as Record<string, unknown>).note_count],
  ], warn);
};

export const isProjectArray = (obj: unknown, warn = false): obj is Project[] => {
  if (!Array.isArray(obj)) {
    if (warn) console.warn("[isProjectArray] expected array, got:", typeof obj, obj);
    return false;
  }
  const invalidIndex = obj.findIndex(item => !isProject(item, warn));
  if (invalidIndex !== -1) {
    if (warn) console.warn(`[isProjectArray] item at index ${invalidIndex} failed validation`, obj[invalidIndex]);
    return false;
  }
  return true;
};

export const isProjectRawArray = (obj: unknown, warn = false): obj is ProjectRaw[] => {
  if (!Array.isArray(obj)) {
    if (warn) console.warn("[isProjectRawArray] expected array, got:", typeof obj, obj);
    return false;
  }
  const invalidIndex = obj.findIndex(item => !isProjectRaw(item, warn));
  if (invalidIndex !== -1) {
    if (warn) console.warn(`[isProjectRawArray] item at index ${invalidIndex} failed validation`, obj[invalidIndex]);
    return false;
  }
  return true;
};

export const isUserQueryObjectArray = (obj: unknown, warn = false): obj is UserQueryObject[] => {
  if (!Array.isArray(obj)) {
    if (warn) console.warn("[isUserQueryObjectArray] expected array, got:", typeof obj, obj);
    return false;
  }
  const invalidIndex = obj.findIndex(item => !isUserQueryObject(item, warn));
  if (invalidIndex !== -1) {
    if (warn) console.warn(`[isUserQueryObjectArray] item at index ${invalidIndex} failed validation`, obj[invalidIndex]);
    return false;
  }
  return true;
};

export const isUserQueryObject = (obj: unknown, warn = false): obj is UserQueryObject => {
  if (!isObject(obj)) {
    if (warn) console.warn("[isUserQueryObject] expected object, got:", typeof obj, obj);
    return false;
  }
  if (!checkProperties("isUserQueryObject", obj, [
    ["sid", "sid" in obj, "present", obj.sid],
    ["status", "status" in obj, "present", obj.status],
    ["data", isObject(obj.data), "object", obj.data],
  ], warn)) return false;

  const data = obj.data as Record<string, unknown>;
  if (!checkProperties("isUserQueryObject.data", data, [
    ["aras", "aras" in data, "present", data.aras],
    ["bookmark_ids", "bookmark_ids" in data, "present", data.bookmark_ids],
    ["deleted", "deleted" in data, "present", data.deleted],
    ["note_count", "note_count" in data, "present", data.note_count],
    ["qid", "qid" in data, "present", data.qid],
    ["query", isObject(data.query), "object", data.query],
    ["time_created", "time_created" in data, "present", data.time_created],
    ["time_updated", "time_updated" in data, "present", data.time_updated],
    ["title", "title" in data, "present", data.title],
  ], warn)) return false;

  const query = data.query as Record<string, unknown>;
  const validTypes = ['drug', 'gene', 'chemical', 'pathfinder'];
  return checkProperties("isUserQueryObject.data.query", query, [
    ["type", typeof query.type === 'string' && validTypes.includes(query.type), `one of: ${validTypes.join(', ')}`, query.type],
  ], warn);
};

export const isProjectUpdate = (obj: unknown, warn = false): obj is ProjectUpdate => {
  if (!isObject(obj)) {
    if (warn) console.warn("[isProjectUpdate] expected object, got:", typeof obj, obj);
    return false;
  }
  return checkProperties("isProjectUpdate", obj, [
    ["id", "id" in obj, "present", obj.id],
    ["title", "title" in obj, "present", obj.title],
    ["pks", "pks" in obj, "present", obj.pks],
  ], warn);
};