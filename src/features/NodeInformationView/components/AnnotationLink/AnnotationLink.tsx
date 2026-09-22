import { FC, ReactNode } from "react";
import ExternalLink from "@/assets/icons/buttons/External Link.svg?react";
import styles from "./AnnotationLink.module.scss";

interface AnnotationLinkProps {
  href: string;
  children: ReactNode;
}

/**
 * An external link inside an annotation section, with the external link icon.
 */
const AnnotationLink: FC<AnnotationLinkProps> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer" className={styles.annotationLink}>
    {children}<ExternalLink/>
  </a>
);

export default AnnotationLink;
