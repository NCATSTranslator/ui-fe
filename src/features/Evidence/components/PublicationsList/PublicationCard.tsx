import { FC, memo, ReactNode } from 'react';
import { PublicationObject } from '@/features/Evidence/types/evidence';
import { ResultEdge } from '@/features/ResultList/types/results';
import EmphasizeWord from '@/features/Core/components/EmphasizeWord/EmphasizeWord';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { getPublicationEdgeSupport } from '@/features/Evidence/utils/utilities';
import EvidenceLink from '@/features/Evidence/components/EvidenceLink/EvidenceLink';
import SourceLink from '@/features/Evidence/components/EvidenceLink/SourceLink';
import CardMeta from '@/features/Evidence/components/EvidenceSection/CardMeta';
import cardStyles from '@/features/Evidence/components/EvidenceSection/evidenceCards.module.scss';

// Publications whose year could not be found are given a year of "0" so they sort last
const UNKNOWN_YEAR = '0';

/** The names of the selected edge's subject and object, emphasized in supporting text. */
export interface EdgeNodeNames {
  subject: string;
  object: string;
}

// Same support-vs-snippet decision as the CSV export (getPublicationDisplaySnippet).
const getSnippet = (
  pub: PublicationObject,
  selectedEdge: ResultEdge | null,
  nodeNames: EdgeNodeNames | null,
): ReactNode => {
  const support = getPublicationEdgeSupport(pub, selectedEdge);
  if (!support) return pub.snippet;
  if (!nodeNames) return support.text;
  return (
    <EmphasizeWord
      text={support.text}
      objectName={nodeNames.object}
      objectPos={support.object || null}
      subjectName={nodeNames.subject}
      subjectPos={support.subject || null}
    />
  );
};

interface PublicationCardProps {
  pub: PublicationObject;
  selectedEdge: ResultEdge | null;
  /** Null when there is no result set to name the nodes from; supporting text is then shown plain. */
  nodeNames: EdgeNodeNames | null;
}

const PublicationCard: FC<PublicationCardProps> = ({ pub, selectedEdge, nodeNames }) => {
  const title = pub.title || 'No Title Available';
  const snippet = getSnippet(pub, selectedEdge, nodeNames);
  const hasYear = !!pub.pubdate && pub.pubdate !== UNKNOWN_YEAR;

  return (
    <li className={cardStyles.card}>
      <div className={cardStyles.header}>
        {pub.url ? (
          <EvidenceLink linkType="publication" url={pub.url} className={cardStyles.title}>
            {title}
          </EvidenceLink>
        ) : (
          <span className={joinClasses(cardStyles.title, cardStyles.plainTitle)}>{title}</span>
        )}
        {hasYear && <span className={cardStyles.year}>{pub.pubdate}</span>}
      </div>
      {snippet && <p className={cardStyles.snippet}>{snippet}</p>}
      <CardMeta>
        {!!pub.journal && <span>{pub.journal}</span>}
        {!!pub.source?.name && <SourceLink name={pub.source.name} url={pub.source.url} />}
      </CardMeta>
    </li>
  );
};

// A long list re-renders whenever the view does; a card only needs to when its own publication changes
export default memo(PublicationCard);
