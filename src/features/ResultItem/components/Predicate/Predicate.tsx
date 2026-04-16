import { FC, MouseEvent, useMemo, RefObject } from 'react';
import styles from './Predicate.module.scss';
import PathArrow from '@/assets/icons/connectors/PathArrow.svg?react';
import PubIcon from '@/assets/icons/status/HasPub.svg?react';
import CTIcon from '@/assets/icons/status/HasCT.svg?react';
import Up from '@/assets/icons/directional/Chevron/Chevron Up.svg?react';
import InferredBorder from '@/assets/icons/connectors/Double Lines.svg?react';
import Highlighter from 'react-highlight-words';
import { getCompressedEdge, joinClasses } from '@/features/Common/utils/utilities';
import { checkEdgesForClinicalTrials, checkEdgesForPubs } from '@/features/Evidence/utils/utilities';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import EdgeTooltipContent from '@/features/Core/components/Tooltips/EdgeTooltipContent';
import { edgesToTooltipEntries } from '@/features/Core/components/Tooltips/tooltipMappers';
import SupportPathGroup from '@/features/ResultItem/components/SupportPathGroup/SupportPathGroup';
import { Path, PathFilterState, ResultEdge } from '@/features/ResultList/types/results';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useSelector } from 'react-redux';
import { useExpandedPredicate, useLastViewedPath, useSupportPathKey } from '@/features/ResultItem/hooks/resultHooks';
import { generatePredicateId } from '@/features/ResultItem/utils/utilities';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { extractCompressedEdgeSets } from '@/features/Navigation/utils/navigationUtils';

interface PredicateProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  className?: string;
  handleEdgeClick?: (edgeIDs: string[], path: Path) => void;
  hoverHandlers?: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  edge: ResultEdge;
  edgeIds: string[];
  inModal?: boolean | null;
  isEven?: boolean;
  isHighlighted?: boolean;
  isSeen?: boolean;
  parentClass?: string;
  parentStyles?: {[key: string]: string;} | null;
  pathFilterState: PathFilterState;
  path: Path;
  parentPathKey: string;
  pathViewStyles?: {[key: string]: string;} | null;
  pk: string;
  selected?: boolean;
  selectedEdgeRef?: RefObject<HTMLElement | null>;
  selectedPaths: Set<Path> | null;
  showHiddenPaths: boolean;
  uid: string;
}

const Predicate: FC<PredicateProps> = ({
  activeEntityFilters,
  activeFilters,
  className = "",
  edge,
  edgeIds,
  handleEdgeClick,
  hoverHandlers,
  inModal = false,
  isEven = false,
  isHighlighted = false,
  isSeen = false,
  parentClass = '',
  parentStyles,
  pathFilterState,
  path,
  parentPathKey,
  pathViewStyles = null,
  pk,
  selected = false,
  selectedEdgeRef,
  selectedPaths,
  showHiddenPaths,
  uid }) => {

  const resultSet = useSelector(getResultSetById(pk));
  const formattedEdge = (!!resultSet && Array.isArray(edgeIds) && edgeIds.length > 1) ? getCompressedEdge(resultSet, edgeIds) : edge;
  const hasMore = (!!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0);

  const { expandedPredicateId, setExpandedPredicateId } = useExpandedPredicate();
  const { navigateToEvidenceView } = useResultListContext();
  const { setLastViewedPathID } = useLastViewedPath();
  const supportPathKey = useSupportPathKey();
  const fullPathKey = supportPathKey ? `${supportPathKey}.${parentPathKey}` : parentPathKey;

  // Create a unique identifier for this predicate
  const predicateId = useMemo(() => {
    return generatePredicateId(path, edgeIds);
  }, [path.id, edgeIds]);

  // Determine if this predicate is expanded
  const isSupportExpanded = (expandedPredicateId === predicateId);

  const edgeArrayToCheck = (!!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0) ? [...formattedEdge.compressed_edges, formattedEdge] : [formattedEdge];
  const hasPubs = checkEdgesForPubs(edgeArrayToCheck);
  const hasCTs = checkEdgesForClinicalTrials(edgeArrayToCheck);
  const isInferred = formattedEdge?.inferred ?? false;

  const handleSupportExpansion = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setExpandedPredicateId(isSupportExpanded ? null : predicateId);
  }

  const edgesToDisplay: ResultEdge[] = (!!formattedEdge?.compressed_edges)
  ? [...formattedEdge.compressed_edges, formattedEdge]
  : [formattedEdge];

  const tooltipEdgeEntries = useMemo(() => {
    if (!resultSet) return [];
    return edgesToTooltipEntries(resultSet, edgesToDisplay.filter(Boolean) as ResultEdge[]);
  }, [resultSet, formattedEdge]);

  const edgeClass = joinClasses(
    styles.edge,
    className,
    parentClass,
    hasPubs && styles.hasPubs,
    hasCTs && styles.hasCTs,
    isInferred && styles.isInferred,
    !!pathViewStyles && pathViewStyles.predicateInterior,
    (isSeen && parentStyles) && `${parentStyles.seen}`,
    (selected && parentStyles) && `${parentStyles.selected} ${styles.selected}`,
    (inModal && parentStyles) && `${parentStyles.inModal} ${styles.inModal}`,
    (isEven && parentStyles) && `${parentStyles.isEven} ${styles.isEven}`,
    (isHighlighted && parentStyles) && `${parentStyles.highlighted} ${styles.highlighted}`
  )

  const handlePredicateClick = (e: MouseEvent<HTMLSpanElement>, selectedEdgeId: string, compressedEdgeIds: string[], targetPath: Path, targetFullPathKey: string) => {
    e.stopPropagation();
    handleEdgeClick?.([selectedEdgeId, ...compressedEdgeIds], targetPath);
    setLastViewedPathID(targetPath?.id || null);
    if(!inModal) {
      let allSets = extractCompressedEdgeSets(targetPath);
      if (allSets.length === 0 && edgeIds.length > 1) allSets = [edgeIds];
      navigateToEvidenceView(selectedEdgeId, allSets, targetPath, targetFullPathKey);
    }
  }

  return (
    <>
      <span
        className={edgeClass}
        data-tooltip-id={`${formattedEdge.predicate}${uid}`}
        data-edge-ids={edgeIds.toString()}
        data-aras={edge.aras.toString()}
        onClick={(e)=> handlePredicateClick(e, edgeIds[0], edgeIds.slice(1), path, fullPathKey)}
        ref={selected ? selectedEdgeRef : null}
        {...hoverHandlers}
        >
        <div className={`${parentStyles && parentStyles.nameShape} ${styles.nameShape}`}>
          <div className={`${parentStyles && parentStyles.background} ${styles.background}`}></div>
          <InferredBorder className={styles.border}/>
        </div>
        <PathArrow className={`${parentStyles && parentStyles.icon} ${pathViewStyles && pathViewStyles.icon}`}/>
        <Tooltip
          id={`${formattedEdge.predicate}${uid}`}
          place={`${inModal ? 'left' : 'top' }`}
          >
          {resultSet &&
            <EdgeTooltipContent
              edges={tooltipEdgeEntries}
              activeEntityFilters={activeEntityFilters}
              inModal={!!inModal}
              onPredicateClick={(e, edgeId) => handlePredicateClick(e, edgeId, edgeIds.filter(id => id !== edgeId), path, fullPathKey)}
            />
          }
        </Tooltip>
        <span
          className={`${styles.pred} pred ${hasMore ? styles.hasMore : ''}`}
          >
          <span className={styles.predLabel}>
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeEntityFilters}
              autoEscape={true}
              textToHighlight={formattedEdge.predicate}
            />
            {
              !!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0 &&
              <span className={styles.more}>+{formattedEdge.compressed_edges.length}</span>
            }
          </span>
          {
            (hasPubs || hasCTs) &&
            <div className={styles.badges}>
              {
                hasPubs && <PubIcon/>
              }
              {
                hasCTs && <CTIcon/>
              }
            </div>
          }
          {
            isInferred && !inModal &&
            <button
              onClick={handleSupportExpansion}
              className={`support-button ${styles.supportExpansionButton} ${isSupportExpanded ? styles.expanded : ''}`}>
              <div className={styles.supportConnector}></div>
              <span className={styles.supportButtonIcon}>
                <Up/>
              </span>
            </button>
          }
        </span>
      </span>
      {
        isInferred && !inModal &&
        <SupportPathGroup
          pathArray={formattedEdge.support}
          isExpanded={isSupportExpanded}
          isEven={isEven}
          pathFilterState={pathFilterState}
          pathViewStyles={pathViewStyles}
          handleEdgeClick={handleEdgeClick}
          selectedPaths={selectedPaths}
          activeEntityFilters={activeEntityFilters}
          activeFilters={activeFilters}
          pk={pk}
          showHiddenPaths={showHiddenPaths}
          parentPathKey={parentPathKey}
        />
      }
    </>
  )
}

export default Predicate;
