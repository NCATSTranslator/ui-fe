import * as tc from "@/features/Common/types/checkers";
import { isProvenance } from "@/features/Evidence/types/checkers";
import { ResultEdge, ResultNode, Path, Tags, Annotation, ChemicalAnnotation, 
  DiseaseAnnotation, GeneAnnotation, EdgeMetadata } from "./results";

export const isSpecies = tc.makeIsOneOf(["Zebrafish", "Mouse", "Rat"] as const);
export const isTdl = tc.makeIsOneOf(["Tclin", "Tchem", "Tbio", "Tdark"] as const);


export const isResultEdge = (obj: unknown, warn = true): obj is ResultEdge => {
  if (!tc.isObject(obj)) {
    if (warn) console.warn("[isResultEdge] expected object, got:", typeof obj, obj);
    return false;
  }
  return tc.checkProperties("isResultEdge", obj, [
    ["aras", tc.isStringArray(obj.aras), "string[]", obj.aras],
    ["description", tc.missable(obj.description, tc.isString), "string | undefined | null", obj.description],
    ["id", tc.isString(obj.id), "string", obj.id],
    ["is_root", tc.isBoolean(obj.is_root), "boolean", obj.is_root],
    ["knowledge_level", tc.isString(obj.knowledge_level), "string", obj.knowledge_level],
    ["metadata", __isEdgeMetadata(obj.metadata, warn), "EdgeMetadata", obj.metadata],
    ["object", tc.isString(obj.object), "string", obj.object],
    ["predicate", tc.isString(obj.predicate), "string", obj.predicate],
    ["predicate_url", tc.isString(obj.predicate_url), "string", obj.predicate_url],
    ["provenance", tc.makeIsHomogeneousArray((p: unknown) => isProvenance(p, warn))(obj.provenance), "Provenance[]", obj.provenance],
    ["publications", tc.isObject(obj.publications), "object", obj.publications],
    ["subject", tc.isString(obj.subject), "string", obj.subject],
    ["support", tc.isStringArray(obj.support), "string[]", obj.support],
    ["type", tc.isString(obj.type), "string", obj.type],
  ], warn);

  function __isEdgeMetadata(obj: unknown, warn = true): obj is EdgeMetadata {
    if (!tc.isObject(obj)) {
      if (warn) console.warn("[isResultEdge.metadata] expected object, got:", typeof obj, obj);
      return false;
    }
    return tc.checkProperties("isResultEdge.metadata", obj, [
      ["edge_bindings", tc.isStringArray(obj.edge_bindings), "string[]", obj.edge_bindings],
      ["inverted_id", tc.nullable(obj.inverted_id, tc.isString), "string | null", obj.inverted_id],
      ["is_root", tc.isBoolean(obj.is_root), "boolean", obj.is_root],
    ], warn);
  }
}

export const isResultNode = (obj: unknown, warn = true): obj is ResultNode => {
  if (!tc.isObject(obj)) {
    if (warn) console.warn("[isResultNode] expected object, got:", typeof obj, obj);
    return false;
  }
  return tc.checkProperties("isResultNode", obj, [
    ["annotations", __isAnnotation(obj.annotations, warn), "Annotation", obj.annotations],
    ["aras", tc.isStringArray(obj.aras), "string[]", obj.aras],
    ["curies", tc.isStringArray(obj.curies), "string[]", obj.curies],
    ["descriptions", tc.isStringArray(obj.descriptions), "string[]", obj.descriptions],
    ["id", tc.isString(obj.id), "string", obj.id],
    ["names", tc.isStringArray(obj.names), "string[]", obj.names],
    ["provenance", tc.isStringArray(obj.provenance), "string[]", obj.provenance],
    ["synonyms", tc.isStringArray(obj.synonyms), "string[]", obj.synonyms],
    ["types", tc.isStringArray(obj.types), "string[]", obj.types],
  ], warn);

  function __isAnnotation(obj: unknown, warn = true): obj is Annotation {
    if (!tc.isObject(obj)) {
      if (warn) console.warn("[isResultNode.annotations] expected object, got:", typeof obj, obj);
      return false;
    }
    return tc.checkProperties("isResultNode.annotations", obj, [
      ["chemical", __isChemicalAnnotation(obj.chemical, warn), "ChemicalAnnotation", obj.chemical],
      ["disease", __isDiseaseAnnotation(obj.disease, warn), "DiseaseAnnotation", obj.disease],
      ["gene", __isGeneAnnotation(obj.gene, warn), "GeneAnnotation", obj.gene],
    ], warn);
  }

  function __isChemicalAnnotation(obj: unknown, warn = true): obj is ChemicalAnnotation {
    if (!tc.isObject(obj)) {
      if (warn) console.warn("[isResultNode.annotations.chemical] expected object, got:", typeof obj, obj);
      return false;
    }
    return tc.checkProperties("isResultNode.annotations.chemical", obj, [
      ["approval", tc.nullable(obj.approval, tc.isNumber), "number | null", obj.approval],
      ["clinical_trials", tc.nullable(obj.clinical_trials, tc.isStringArray), "string[] | null", obj.clinical_trials],
      ["descriptions", tc.nullable(obj.descriptions, tc.isStringArray), "string[] | null", obj.descriptions],
      ["indications", tc.nullable(obj.indications, tc.isStringArray), "string[] | null", obj.indications],
      ["otc_status", tc.nullable(obj.otc_status, (e) => tc.isObject(e) && tc.isNumber(e.code) && tc.isString(e.label)), "{code, label} | null", obj.otc_status],
      ["other_names", tc.nullable(obj.other_names, e => tc.isObject(e) && tc.isStringArray(e.commercial) && tc.isStringArray(e.generic)), "{commercial, generic} | null", obj.other_names],
      ["roles", tc.nullable(obj.roles, tc.makeIsHomogeneousArray(e => tc.isObject(e) && tc.isString(e.id) && tc.isString(e.name))), "ChebiRole[] | null", obj.roles],
    ], warn);
  }

  function __isDiseaseAnnotation(obj: unknown, warn = true): obj is DiseaseAnnotation {
    if (!tc.isObject(obj)) {
      if (warn) console.warn("[isResultNode.annotations.disease] expected object, got:", typeof obj, obj);
      return false;
    }
    return tc.checkProperties("isResultNode.annotations.disease", obj, [
      ["curies", tc.nullable(obj.curies, tc.isStringArray), "string[] | null", obj.curies],
      ["descriptions", tc.nullable(obj.descriptions, tc.isStringArray), "string[] | null", obj.descriptions],
    ], warn);
  }

  function __isGeneAnnotation(obj: unknown, warn = true): obj is GeneAnnotation {
    if (!tc.isObject(obj)) {
      if (warn) console.warn("[isResultNode.annotations.gene] expected object, got:", typeof obj, obj);
      return false;
    }
    return tc.checkProperties("isResultNode.annotations.gene", obj, [
      ["descriptions", tc.nullable(obj.descriptions, tc.isStringArray), "string[] | null", obj.descriptions],
      ["name", tc.nullable(obj.name, tc.isString), "string | null", obj.name],
      ["species", tc.nullable(obj.species, isSpecies), "Species | null", obj.species],
      ["tdl", tc.nullable(obj.tdl, isTdl), "Tdl | null", obj.tdl],
    ], warn);
  }
}

export const isPath = (obj: unknown, warn = true): obj is Path => {
  if (!tc.isObject(obj)) {
    if (warn) console.warn("[isPath] expected object, got:", typeof obj, obj);
    return false;
  }
  return tc.checkProperties("isPath", obj, [
    ["aras", tc.isStringArray(obj.aras), "string[]", obj.aras],
    ["compressedIDs", tc.missable(obj.compressedIDs, tc.isStringArray), "string[] | undefined | null", obj.compressedIDs],
    ["compressedSubgraph", tc.missable(obj.compressedSubgraph, tc.makeIsHomogeneousArray((e: unknown) => tc.isString(e) || tc.isStringArray(e))), "(string | string[])[] | undefined | null", obj.compressedSubgraph],
    ["highlighted", tc.missable(obj.highlighted, tc.isBoolean), "boolean | undefined | null", obj.highlighted],
    ["id", tc.missable(obj.id, tc.isString), "string | undefined | null", obj.id],
    ["score", tc.missable(obj.score, tc.isNumber), "number | undefined | null", obj.score],
    ["subgraph", tc.isStringArray(obj.subgraph), "string[]", obj.subgraph],
    ["tags", isTags(obj.tags, warn), "Tags", obj.tags],
  ], warn);
}

export const isTags = (obj: unknown, warn = true): obj is Tags => {
  if (!tc.isObject(obj)) {
    if (warn) console.warn("[isTags] expected object, got:", typeof obj, obj);
    return false;
  }
  for (const key in obj) {
    const tag = (obj as Record<string, unknown>)[key];
    if (!tc.nullable(tag, (t) => tc.isObject(t) && tc.isString(t.name) && tc.isString(t.value))) {
      if (warn) console.warn(`[isTags] invalid tag at key "${key}": expected {name, value} | null, got:`, tag);
      return false;
    }
  }
  return true;
};