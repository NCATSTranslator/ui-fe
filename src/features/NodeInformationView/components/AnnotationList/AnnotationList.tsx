import { FC, ReactNode } from "react";
import styles from "./AnnotationList.module.scss";

/**
 * Renders annotation items one per line. Items are keyed by index because
 * annotation values are plain strings or nodes without stable ids.
 */
const AnnotationList: FC<{ items: ReactNode[] }> = ({ items }) => (
  <ul className={styles.annotationList}>
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);

export default AnnotationList;
