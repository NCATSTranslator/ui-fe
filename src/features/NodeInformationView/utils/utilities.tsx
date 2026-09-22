import { ReactNode } from "react";
import { AnnotationSource, ResultNode } from "@/features/ResultList/types/results";
import AnnotationList from "@/features/NodeInformationView/components/AnnotationList/AnnotationList";

export const formatLabel = (key: string): string =>
  key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

/**
 * Renders a list of annotation items one per line. An empty list renders nothing.
 */
export const renderList = (items: ReactNode[]): ReactNode =>
  items.length === 0 ? null : <AnnotationList items={items} />;

/**
 * Determines whether an annotation value has nothing worth displaying, so the
 * caller can skip the section entirely rather than render an empty label.
 * Numbers are never empty, so falsy-but-meaningful values like 0 are preserved.
 */
export const isEmptyAnnotationValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "object") return Object.values(value).flat().length === 0;
  return false;
};

const renderArrayValue = (value: unknown[]): ReactNode => {
  if (value.length === 0) return null;
  if (typeof value[0] === "string") return renderList(value.filter(v => typeof v === "string"));
  if (typeof value[0] !== "object" || value[0] === null) return null;
  const nodes = value.map((raw, i) => {
    const item = raw as { url?: string; title?: ReactNode; name?: ReactNode };
    if ("url" in item && "title" in item) {
      return <a key={i} href={item.url} target="_blank" rel="noreferrer">{item.title}</a>;
    }
    if ("name" in item) return item.name;
    return JSON.stringify(item);
  });
  return renderList(nodes);
};

export const renderValue = (value: unknown): ReactNode => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return renderArrayValue(value);
  if (typeof value !== "object" || value === null) return null;
  const entries = Object.values(value).flat().filter(Boolean);
  if (entries.length === 0) return null;
  if (entries.every(e => typeof e === "string")) return renderList(entries as string[]);
  return null;
};

const getHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

/**
 * Display order for annotation sections, as "category.key" using the keys the
 * backend emits.
 */
const _ANNOTATION_SECTION_ORDER: string[] = [
  "chemical.roles",
  "chemical.approval",
  "chemical.indications",
  "chemical.synonyms",
  "chemical.otc_status",
  "chemical.clinical_trials",
  "gene.species",
  "gene.tdl",
  "disease.synonyms",
  "disease.clinical_trials",
  "disease.curies",
];

/**
 * Orders annotation fields by _ANNOTATION_SECTION_ORDER. Fields whose key is
 * not listed keep their relative order and follow the listed ones.
 */
export const sortAnnotationFields = <T extends { key: string }>(
  fields: T[],
  order: string[] = _ANNOTATION_SECTION_ORDER,
): T[] => {
  const rank = (field: T): number => {
    const index = order.indexOf(field.key);
    return index === -1 ? order.length : index;
  };
  return fields
    .map((field, i) => ({ field, i }))
    .sort((a, b) => rank(a.field) - rank(b.field) || a.i - b.i)
    .map(({ field }) => field);
};

/**
 * Frontend overrides for annotation source link labels. Keyed by the source id
 * the backend emits.
 */
export interface AnnotationSectionOverride {
  heading?: string;
  sourceLabel?: string;
}

/** Key of the frontend-built Object Type section, which is not an annotation. */
export const OBJECT_TYPE_SECTION_KEY = "object_type";

/**
 * Allows for per-section annotation heading and source label injection.
 */
export const _ANNOTATION_SECTION_OVERRIDES: Record<string, AnnotationSectionOverride> = {
  "chemical.otc_status": {
    heading: "Over the Counter Status"
  },
  "disease.curies": {
    heading: "IDs"
  },
  "gene.tdl": {
    heading: "Target Development Level",
    sourceLabel: "Learn more about Target Development Levels"
  },
  [OBJECT_TYPE_SECTION_KEY]: {
    sourceLabel: "Learn more about the Biolink Model"
  },
};

/**
 * The heading for an annotation section.
 */
export const getAnnotationSectionHeading = (
  sectionKey: string,
  key: string,
  overrides: Record<string, AnnotationSectionOverride> = _ANNOTATION_SECTION_OVERRIDES,
): string => overrides[sectionKey]?.heading ?? formatLabel(key);

/**
 * The user-facing label for an annotation source linkout.
 */
export const getAnnotationSourceLabel = (
  source: AnnotationSource,
  sectionKey?: string,
  overrides: Record<string, AnnotationSectionOverride> = _ANNOTATION_SECTION_OVERRIDES,
): string => {
  const override = sectionKey ? overrides[sectionKey]?.sourceLabel : undefined;
  if (override) return override;
  const name = source.name || getHostname(source.url);
  return name ? `Learn more on ${name}` : source.url;
};

/**
 * Get the Biolink Model link for a node
 * @param node - The node to get the link for
 * @returns The Biolink Model link for the node
 */
export const getNodeBiolinkLink = (node: ResultNode): string => {
  const nodeType = node.types[0].replace('biolink:', '');
  return `https://biolink.github.io/biolink-model/${nodeType}`;
};

/**
 * The Biolink Model source for the Object Type section. It is built on the
 * frontend since it is not constructed directly from the annotations.
 */
export const getBiolinkSource = (url: string): AnnotationSource => ({
  id: "biolink",
  name: "Biolink Model",
  url,
});
