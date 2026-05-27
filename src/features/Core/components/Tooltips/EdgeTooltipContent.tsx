import { FC, MouseEvent, useMemo } from 'react';
import Highlighter from 'react-highlight-words';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import PubIcon from '@/assets/icons/status/HasPub.svg?react';
import CTIcon from '@/assets/icons/status/HasCT.svg?react';
import AcceptedOntologyIcon from '@/assets/icons/queries/Accepted Ontology.svg?react';
import styles from './Tooltips.module.scss';
import { EvidenceTabName } from '@/features/Evidence/types/navigation';

export interface EdgeTooltipEntry {
  id: string;
  predicate: string;
  description?: string;
  predicate_url?: string;
  pubCount: number;
  ctCount: number;
}

export interface PredicateClickOptions {
  tab?: EvidenceTabName;
}

export interface EdgeTooltipContentProps {
  activeEntityFilters?: string[];
  edges: EdgeTooltipEntry[];
  inModal?: boolean;
  isAcceptedOntology?: boolean;
  onPredicateClick?: (e: MouseEvent<HTMLSpanElement>, edgeId: string, options?: PredicateClickOptions) => void;
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
  isAcceptedOntology = false,
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
          <span
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
              <span className={styles.predicateImpact}>(either positively or negatively)</span>
            }
          </span>
          {renderDescription(edge.predicate, edge.description)}
          {edge.predicate_url &&
            <a
              href={edge.predicate_url}
              onClick={(e) => e.stopPropagation()}
              className={styles.predicateUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>Learn More on Biolink Model</span>
              <ExternalLink />
            </a>
          }
          {(edge.pubCount > 0 || edge.ctCount > 0 || isAcceptedOntology) &&
            <div className={styles.tooltipEvidenceCounts}>
              {edge.pubCount > 0 &&
                <span
                  className={styles.count}
                  onClick={(e) => onPredicateClick?.(e, edge.id, { tab: 'Publications' })}
                >
                  <PubIcon />{edge.pubCount} Publication{edge.pubCount > 1 && 's'}
                </span>
              }
              {edge.ctCount > 0 &&
                <span
                  className={styles.count}
                  onClick={(e) => onPredicateClick?.(e, edge.id, { tab: 'Clinical Trials' })}
                >
                  <CTIcon />{edge.ctCount} Clinical Trial{edge.ctCount > 1 && 's'}
                </span>
              }
              {
                isAcceptedOntology &&
                <span
                  className={styles.count}
                  onClick={(e) => onPredicateClick?.(e, edge.id, { tab: 'Knowledge Sources' })}
                >
                  <AcceptedOntologyIcon /> Accepted Ontology
                </span>
              }
            </div>
          }
        </div>
      ))}
    </div>
  );
};

export default EdgeTooltipContent;
