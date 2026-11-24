import { FC } from 'react';
import EvidenceLink from '@/features/Evidence/components/EvidenceLink/EvidenceLink';
import cardStyles from '@/features/Evidence/components/EvidenceSection/evidenceCards.module.scss';

interface SourceLinkProps {
  name: string;
  url?: string | null;
}

/**
 * The name of the source a piece of evidence came from, linked when the source has a URL.
 */
const SourceLink: FC<SourceLinkProps> = ({ name, url }) => (
  url
    ? <EvidenceLink linkType="source" url={url} className={cardStyles.metaLink}>{name}</EvidenceLink>
    : <span>{name}</span>
);

export default SourceLink;
