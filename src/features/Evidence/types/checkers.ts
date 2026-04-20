import * as tc from "@/features/Common/types/checkers";
import { Provenance, PublicationObject, RawPublicationObject } from "@/features/Evidence/types/evidence";
import { ResultEdge } from "@/features/ResultList/types/results";

/**
 * Type guard to check if an object is a Provenance object.
 *
 * @param {unknown} obj - The object to check.
 * @param {boolean} warn - Whether to warn if the object is not a Provenance.
 * @returns {boolean} - True if the object is a Provenance, otherwise false.
 */
export const isProvenance = (obj: unknown, warn = false): obj is Provenance => {
  if (!tc.isObject(obj)) {
    if (warn) console.warn("[isProvenance] expected object, got:", typeof obj, obj);
    return false;
  }
  return tc.checkProperties("isProvenance", obj, [
    ["infores", tc.isString(obj.infores), "string", obj.infores],
    ["knowledge_level", tc.isString(obj.knowledge_level), "string", obj.knowledge_level],
    ["name", tc.isString(obj.name), "string", obj.name],
    ["url", tc.nullable(obj.url, tc.isString), "string | null", obj.url],
    ["wiki", tc.nullable(obj.wiki, tc.isString), "string | null", obj.wiki],
  ], warn);
}

/**
 * Determines if a publication object is categorized as a publication based on its type or ID
 *
 * @param {PublicationObject | RawPublicationObject} publication - The publication object to check.
 * @param {boolean} warn - Whether to warn if the object is not a publication.
 * @returns {boolean} - True if the object is a publication (PMID or PMC), false otherwise.
 */
export const isPublication = (obj: PublicationObject | RawPublicationObject, warn = false): boolean => {
  if(isPublicationObject(obj, false) && (obj.type === "PMID" || obj.type === "PMC")) {
    return true;
  } else if(obj.id?.includes("PMID") || obj.id?.includes("PMC")) {
    return true;
  }

  if(warn) console.warn("[isPublication] expected publication, got:", typeof obj, obj);

  return false;
}

/**
 * Type guard to check if an object is a PublicationObject.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a PublicationObject, otherwise false.
 */
export const isPublicationObject = (obj: unknown, warn = false): obj is PublicationObject => {
  if (typeof obj !== 'object' || obj === null) {
    if (warn) console.warn("[isPublicationObject] expected object, got:", typeof obj, obj);
    return false;
  }
  const o = obj as Record<string, unknown>;
  return tc.checkProperties("isPublicationObject", obj, [
    ["source", tc.isObject(o.source), "object", o.source],
    ["type", tc.isString(o.type), "string", o.type],
    ["url", tc.isString(o.url), "string", o.url],
  ], warn);
}

/**
 * Type guard to check if an object is an array of PublicationObjects.
 *
 * @param arr - The object to check.
 * @returns {boolean} True if the object is a PublicationsList, otherwise false.
 */
export const isPublicationObjectArray = (arr: unknown, warn = false): arr is PublicationObject[] => {
  if (!Array.isArray(arr)) {
    if (warn) console.warn("[isPublicationObjectArray] expected array, got:", typeof arr, arr);
    return false;
  }
  const invalidIndex = arr.findIndex(item => !isPublicationObject(item, warn));
  if (invalidIndex !== -1) {
    if (warn) console.warn(`[isPublicationObjectArray] item at index ${invalidIndex} failed validation`, arr[invalidIndex]);
    return false;
  }
  return true;
}

/**
 * Determines the type of publications structure in a ResultEdge object.
 *
 * @param {ResultEdge} edgeObject - The edge object to check publications type for.
 * @returns {string} - A string indicating the type of publications structure ("PublicationObject[]", "{[key: string]: string[]}", or "Unknown type").
 */
export const checkPublicationsType = (edgeObject: ResultEdge): string => {
  if (isPublicationObjectArray(edgeObject.publications)) {
    return "PublicationObject[]";
  } else if (isPublicationDictionary(edgeObject.publications)) {
    return "{[key: string]: string[]}";
  } else {
    return "Unknown type";
  }
}

/**
 * Type guard to check if an object is a PublicationDictionary.
 *
 * @param publications - The object to check.
 * @returns {boolean} True if the object is a PublicationDictionary, otherwise false.
 */
export const isPublicationDictionary = (publications: unknown, warn = false): publications is {[key: string]: string[]} => {
  if (typeof publications !== 'object' || publications === null || Array.isArray(publications)) {
    if (warn) console.warn("[isPublicationDictionary] expected object, got:", typeof publications, publications);
    return false;
  }
  for (const [key, value] of Object.entries(publications as Record<string, unknown>)) {
    if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
      if (warn) console.warn(`[isPublicationDictionary] invalid value at key "${key}": expected string[], got:`, value);
      return false;
    }
  }
  return true;
}
