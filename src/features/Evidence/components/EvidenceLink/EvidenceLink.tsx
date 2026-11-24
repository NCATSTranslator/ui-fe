import { FC, ReactNode } from 'react';
import type { LinkType } from '@/features/Analytics/types/analytics';
import { getEvidenceLinkTrackingProps } from '@/features/Analytics/utils/linkTracking';

interface EvidenceLinkProps {
  /** What the link points to, reported with the evidence_link_clicked event. */
  linkType: LinkType;
  url: string;
  className?: string;
  children: ReactNode;
}

/**
 * An outbound link from the evidence view: opens in a new tab and reports the click to analytics.
 */
const EvidenceLink: FC<EvidenceLinkProps> = ({ linkType, url, className, children }) => (
  <a
    className={className}
    href={url}
    target="_blank"
    rel="noreferrer"
    {...getEvidenceLinkTrackingProps(linkType, url)}
  >
    {children}
  </a>
);

export default EvidenceLink;
