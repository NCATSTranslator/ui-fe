import { ReactNode } from "react";
import { ResultNode } from "@/features/ResultList/types/results";

export const formatLabel = (key: string): string =>
  key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

/**
 * Interleaves a separator between rendered nodes, keeping React keys intact.
 */
export const joinNodes = (nodes: ReactNode[], separator = ", "): ReactNode[] =>
  nodes.flatMap((node, i) => (i === 0 ? [node] : [separator, node]));

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
  if (typeof value[0] === "string") return value.join(", ");
  if (typeof value[0] !== "object" || value[0] === null) return null;
  const nodes = value.map((raw, i) => {
    const item = raw as { url?: string; title?: ReactNode; name?: ReactNode };
    if ("url" in item && "title" in item) {
      return <a key={i} href={item.url} target="_blank" rel="noreferrer">{item.title}</a>;
    }
    if ("name" in item) return item.name;
    return JSON.stringify(item);
  });
  return joinNodes(nodes);
};

export const renderValue = (value: unknown): ReactNode => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return renderArrayValue(value);
  if (typeof value !== "object" || value === null) return null;
  const entries = Object.values(value).flat().filter(Boolean);
  if (entries.length === 0) return null;
  if (entries.every(e => typeof e === "string")) return (entries as string[]).join(", ");
  return null;
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