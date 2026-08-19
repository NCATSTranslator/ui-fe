import { ReactNode } from "react";
import { ResultNode } from "@/features/ResultList/types/results";

export const formatLabel = (key: string): string =>
  key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

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
  return nodes.flatMap((el, i) => (i === 0 ? [el] : [", ", el]));
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