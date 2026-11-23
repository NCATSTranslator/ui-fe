import { FC } from 'react';
import type { LinkType } from '@/features/Analytics/types/analytics';
import { FormattedMiscEvidence } from '@/features/Evidence/utils/utilities';
import EvidenceLink from '@/features/Evidence/components/EvidenceLink/EvidenceLink';
import cardStyles from '@/features/Evidence/components/EvidenceSection/evidenceCards.module.scss';

interface EvidenceLinkListProps {
  /** Already deduplicated by URL (see formatMiscEvidence). */
  links: FormattedMiscEvidence[];
  /** What the links point to, reported when one is clicked. */
  linkType: LinkType;
}

/**
 * A list of evidence that is nothing more than a link out: drug labels and miscellaneous evidence.
 */
const EvidenceLinkList: FC<EvidenceLinkListProps> = ({ links, linkType }) => (
  <ul className={cardStyles.list}>
    {links.map((item) => (
      <li className={cardStyles.card} key={item.id}>
        <EvidenceLink linkType={linkType} url={item.url} className={cardStyles.title}>
          {item.url}
        </EvidenceLink>
      </li>
    ))}
  </ul>
);

export default EvidenceLinkList;
