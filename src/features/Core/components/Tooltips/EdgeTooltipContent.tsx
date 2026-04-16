import { FC, MouseEvent, useMemo } from 'react';
import Highlighter from 'react-highlight-words';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import PubIcon from '@/assets/icons/status/HasPub.svg?react';
import CTIcon from '@/assets/icons/status/HasCT.svg?react';
import styles from './Tooltips.module.scss';

export interface EdgeTooltipEntry {
  id: string;
  predicate: string;
  description?: string;
  predicate_url?: string;
  pubCount: number;
  ctCount: number;
}

export interface EdgeTooltipContentProps {
  edges: EdgeTooltipEntry[];
  activeEntityFilters?: string[];
  inModal?: boolean;
  onPredicateClick?: (e: MouseEvent<HTMLParagraphElement>, edgeId: string) => void;
}

const renderDescription = (predicate: string, description?: string) => {
  if (predicate === 'impacts') {
    return (
      <span className={styles.predicateDescription}>
        Indicates that a drug affects one or more biological processes relevant to a disease,
        in a way that may improve, worsen, or otherwise modify the condition.
      </span>
    );
  }
  if (!description) return null;
  const replaced = description.replaceAll('treat', 'impact');
  const capitalized = replaced.charAt(0).toUpperCase() + replaced.slice(1);
  const suffix = replaced.slice(-1) !== '.' ? '.' : '';
  return (
    <span className={styles.predicateDescription}>
      {capitalized}{suffix}
    </span>
  );
};

const EdgeTooltipContent: FC<EdgeTooltipContentProps> = ({
  edges,
  activeEntityFilters = [],
  inModal = false,
  onPredicateClick,
}) => {
  const sortedEdges = useMemo(
    () => [...edges].sort((a, b) => a.predicate.localeCompare(b.predicate)),
    [edges]
  );

  return (
    <div className={styles.predicatesList} onClick={(e) => e.stopPropagation()}>
      {sortedEdges.map((edge) => (
        <div key={edge.id} className={styles.tooltipPredicateContainer}>
          <p
            className={`${styles.tooltipPredicate} ${inModal ? styles.inModal : ''}`}
            onClick={(e) => onPredicateClick?.(e, edge.id)}
          >
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeEntityFilters}
              autoEscape={true}
              textToHighlight={edge.predicate}
            />
            {edge.predicate.includes('impact') &&
              <span className={styles.predicateImpact}> (either positively or negatively)</span>
            }
          </p>
          {renderDescription(edge.predicate, edge.description)}
          {edge.predicate_url &&
            <a
              href={edge.predicate_url}
              onClick={(e) => e.stopPropagation()}
              className={styles.predicateUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>{edge.predicate_url}</span>
              <ExternalLink />
            </a>
          }
          {(edge.pubCount > 0 || edge.ctCount > 0) &&
            <div className={styles.tooltipEvidenceCounts}>
              {edge.pubCount > 0 &&
                <span className={styles.count}><PubIcon />{edge.pubCount} Publication{edge.pubCount > 1 && 's'}</span>
              }
              {edge.ctCount > 0 &&
                <span className={styles.count}><CTIcon />{edge.ctCount} Clinical Trial{edge.ctCount > 1 && 's'}</span>
              }
            </div>
          }
        </div>
      ))}
    </div>
  );
};

export default EdgeTooltipContent;
