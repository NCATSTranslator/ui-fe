import { FC, ReactNode } from "react";

interface AnnotationLinkProps {
  href: string;
  children: ReactNode;
}

/**
 * An external link inside an annotation section.
 */
const AnnotationLink: FC<AnnotationLinkProps> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer">{children}</a>
);

export default AnnotationLink;
