import { FC, MouseEvent } from 'react';
import Highlighter from 'react-highlight-words';
import AcceptedOntologyIcon from '@/assets/icons/queries/Accepted Ontology.svg?react';
import styles from './Tooltips.module.scss';
import { EvidenceSectionName } from '@/features/Evidence/types/navigation';
import { EVIDENCE_TYPE_LABELS, EvidenceTypeKey, formatEvidenceCount } from '@/features/Evidence/utils/evidenceLabels';
import { EVIDENCE_TYPE_ICONS } from '@/features/Evidence/utils/evidenceIcons';

export interface EdgeTooltipEntry {
  id: string;
  predicate: string;
  predicate_url?: string;
  pubCount: number;
  ctCount: number;
  drugLabelCount: number;
}

export interface PredicateClickOptions {
  tab?: EvidenceSectionName;
}

export interface EdgeTooltipContentProps {
  activeEntityFilters?: string[];
  /** Shown in the order given; callers pass them most valuable first. */
  edges: EdgeTooltipEntry[];
  inModal?: boolean;
  isAcceptedOntology?: boolean;
  onPredicateClick?: (e: MouseEvent<HTMLSpanElement>, edgeId: string, options?: PredicateClickOptions) => void;
}

type CountKey = 'ctCount' | 'pubCount' | 'drugLabelCount';

/** The counted evidence chips, in display order, each opening its section of the evidence view. */
const COUNT_CHIPS: { type: EvidenceTypeKey; tab: EvidenceSectionName; countKey: CountKey }[] = [
  { type: 'clinicalTrials', tab: 'Clinical Trials', countKey: 'ctCount' },
  { type: 'publications', tab: 'Publications', countKey: 'pubCount' },
  { type: 'drugLabels', tab: 'Drug Labels', countKey: 'drugLabelCount' },
];

const EdgeTooltipContent: FC<EdgeTooltipContentProps> = ({
  edges,
  activeEntityFilters = [],
  inModal = false,
  isAcceptedOntology = false,
  onPredicateClick,
}) => {
  return (
    <div className={styles.predicatesList} onClick={(e) => e.stopPropagation()}>
      {edges.map((edge) => (
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
          {edge.predicate_url &&
            <a
              href={edge.predicate_url}
              onClick={(e) => e.stopPropagation()}
              className={styles.predicateUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>Learn More on Biolink Model</span>
            </a>
          }
          {(isAcceptedOntology || COUNT_CHIPS.some(chip => edge[chip.countKey] > 0)) &&
            <div className={styles.tooltipEvidenceCounts}>
              {COUNT_CHIPS.map(({ type, tab, countKey }) => {
                const count = edge[countKey];
                const Icon = EVIDENCE_TYPE_ICONS[type];
                if (count <= 0) return null;
                return (
                  <span
                    key={type}
                    className={styles.count}
                    onClick={(e) => onPredicateClick?.(e, edge.id, { tab })}
                  >
                    {Icon && <Icon />}{formatEvidenceCount(count, type)}
                  </span>
                );
              })}
              {
                isAcceptedOntology &&
                <span
                  className={styles.count}
                  onClick={(e) => onPredicateClick?.(e, edge.id, { tab: 'Accepted Ontology' })}
                >
                  <AcceptedOntologyIcon /> {EVIDENCE_TYPE_LABELS.acceptedOntologies.singular}
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
