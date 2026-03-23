import { ReactNode } from "react";


export const formatLabel = (key: string): string =>
  key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export const renderValue = (value: unknown): ReactNode => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (typeof value[0] === "string") return value.join(", ");
    if (typeof value[0] === "object" && value[0] !== null) {
      // handles [{name, id}, ...] and [{title, url}, ...]
      return value.map((item, i) => {
        if ("url" in item && "title" in item)
          return <a key={i} href={item.url} target="_blank" rel="noreferrer">{item.title}</a>;
        if ("name" in item) return item.name;
        return JSON.stringify(item);
      }).flatMap((el, i) => i === 0 ? [el] : [", ", el]);
    }
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.values(value).flat().filter(Boolean);
    if (entries.length === 0) return null;
    if (entries.every(e => typeof e === "string")) return (entries as string[]).join(", ");
  }
  return null;
};