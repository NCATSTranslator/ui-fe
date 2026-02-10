import { useState, useEffect, useCallback, useRef, FC, RefObject, lazy, Suspense, Dispatch, SetStateAction, useMemo } from 'react';
import styles from './ResultItem.module.scss';
import { formatBiolinkEntity, formatBiolinkNode, getPathCount } from '@/features/Common/utils/utilities';
import { getARATagsFromResultTags } from '@/features/ResultItem/utils/utilities';
import { getEvidenceCounts } from '@/features/Evidence/utils/utilities';
import PathView from '@/features/ResultItem/components/PathView/PathView';
import LoadingBar from '@/features/Core/components/LoadingBar/LoadingBar';
import ChevDown from "@/assets/icons/directional/Chevron/Chevron Down.svg?react";
import AnimateHeight from "react-animate-height";
import Highlighter from 'react-highlight-words';
import BookmarkConfirmationModal from '@/features/ResultItem/components/BookmarkConfirmationModal/BookmarkConfirmationModal';
// import { CSVLink } from 'react-csv';
// import { generateCsvFromItem } from '@/features/ResultItem/utils/csvGeneration';
import { Save, SaveGroup } from '@/features/UserAuth/utils/userApi';
import { useBookmarkItem } from '@/features/ResultItem/hooks/useBookmarkItem';
import { useSelector } from 'react-redux';
import { getResultSetById, getNodeById, getPathById } from '@/features/ResultList/slices/resultsSlice';
import { currentUser, currentConfig } from '@/features/UserAuth/slices/userSlice';
import { displayScore, generateScore, getPathfinderMetapathScore } from '@/features/ResultList/utils/scoring';
import { QueryType } from '@/features/Query/types/querySubmission';
import { Result, PathFilterState, Path, ResultBookmark } from '@/features/ResultList/types/results';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { useTurnstileEffect } from '@/features/Common/hooks/customHooks';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import * as filtering from '@/features/ResultFiltering/utils/filterFunctions';
import ResultItemName from '@/features/ResultItem/components/ResultItemName/ResultItemName';
import ResultItemInteractables from '@/features/ResultItem/components/ResultItemInteractables/ResultItemInteractables';
import { resultToCytoscape } from '@/features/ResultItem/utils/graphFunctions';
import { useAnimateHeight } from '@/features/Core/hooks/useAnimateHeight';

const GraphView = lazy(() => import("@/features/ResultItem/components/GraphView/GraphView"));

const sortTagsBySelected = (
  a: string,
  b: string,
  selected: [{id: string;}] | Filter[]
): number => {
  const aExistsInSelected = selected.some((item) => item.id === a);
  const bExistsInSelected = selected.some((item) => item.id === b);

  if (aExistsInSelected && bExistsInSelected) return 0;
  if (aExistsInSelected) return -1;
  if (bExistsInSelected) return 1;

  return 0;
};

type ResultItemProps = {
  activateEvidence?: (item: Result, edgeIDs: string[], path: Path, pathKey: string) => void;
  activateNotes?: (nameString: string, id: string) => void;
  activeEntityFilters: string[];
  activeFilters: Filter[];
  availableFilters: {[key: string]: Filter};
  bookmarkAddedToast?: () => void;
  bookmarkRemovedToast?: () => void;
  bookmarkItem?: Save | null;
  handleBookmarkError?: () => void;
  handleFilter: (filter: Filter) => void;
  isEven: boolean;
  isInUserSave?: boolean;
  isPathfinder?: boolean;
  key: string;
  pathFilterState: PathFilterState;
  pk: string | null;
  queryNodeDescription: string | null;
  queryNodeID: string | null;
  queryNodeLabel: string | null;
  queryType: QueryType | null;
  result: Result | ResultBookmark;
  resultsComplete: boolean;
  scoreWeights: {confidenceWeight: number, noveltyWeight: number, clinicalWeight: number };
  setExpandSharedResult: (state: boolean) => void;
  setShareModalOpen: (state: boolean) => void;
  setShareResultID: (state: string) => void;
  setShowHiddenPaths: Dispatch<SetStateAction<boolean>>;
  sharedItemRef: RefObject<HTMLDivElement> | null;
  showHiddenPaths: boolean;
  shouldUpdateResultsAfterBookmark?: RefObject<boolean>;
  startExpanded: boolean;
  updateUserSaves?: Dispatch<SetStateAction<SaveGroup | null>>;
  zoomKeyDown: boolean;
}

const ResultItem: FC<ResultItemProps> = ({
    activateEvidence = () => {},
    activateNotes = () => {},
    activeEntityFilters,
    activeFilters,
    availableFilters: availableTags,
    bookmarkAddedToast = () => {},
    bookmarkRemovedToast = () => {},
    bookmarkItem,
    pk: currentQueryID,
    handleBookmarkError = () => {},
    handleFilter = () => {},
    key,
    isEven = false,
    isInUserSave = false,
    isPathfinder = false,
    queryNodeDescription,
    queryNodeID,
    queryNodeLabel,
    queryType,
    pathFilterState,
    pk,
    result,
    resultsComplete = false,
    scoreWeights,
    setExpandSharedResult = () => {},
    setShareModalOpen = () => {},
    setShareResultID = () => {},
    setShowHiddenPaths,
    sharedItemRef,
    showHiddenPaths,
    startExpanded = false,
    updateUserSaves,
    shouldUpdateResultsAfterBookmark,
    zoomKeyDown
  }) => {

  const resultSet = useSelector(getResultSetById(pk));
  const config = useSelector(currentConfig);
  const {confidenceWeight, noveltyWeight, clinicalWeight} = scoreWeights;
  const firstPath = (typeof result.paths[0] === 'string') ? getPathById(resultSet, result.paths[0] as string) : result.paths[0];
  const score = (isPathfinder && firstPath) ? getPathfinderMetapathScore(firstPath) : generateScore(result.scores, confidenceWeight, noveltyWeight, clinicalWeight);

  const roleCount: number = (!!result) ? Object.keys(result.tags).filter(tag => tag.includes("role")).length : 0;

  const evidenceCounts = (!!result.evidenceCount) ? result.evidenceCount : getEvidenceCounts(resultSet, result);
  const user = useSelector(currentUser);
  
  const {
    isBookmarked,
    hasNotes: itemHasNotes,
    confirmModalOpen: bookmarkRemovalConfirmationModalOpen,
    setConfirmModalOpen: setBookmarkRemovalConfirmationModalOpen,
    handleBookmarkClick,
    handleNotesClick: handleNotesClickHook,
    handleRemovalApproval: handleBookmarkRemovalApproval,
    resetRemovalApproval,
  } = useBookmarkItem({
    bookmarkItem: bookmarkItem ?? null,
    result,
    resultSet,
    queryNodeID,
    queryNodeLabel,
    queryNodeDescription,
    queryType,
    currentQueryID,
    bookmarkAddedToast,
    bookmarkRemovedToast,
    handleBookmarkError,
    updateUserSaves,
    shouldUpdateResultsAfterBookmark,
  });
  
  const { height, isOpen: isExpanded, toggle: handleToggle, setIsOpen: setIsExpanded } = useAnimateHeight({ initialOpen: startExpanded });
  const [graphActive, setGraphActive] = useState<boolean>(false);
  const newPaths = useMemo(()=>(!!result) ? result.paths: [], [result]);
  const [selectedPaths, setSelectedPaths] = useState<Set<Path> | null>(null);
  const graph = useMemo(()=> {
    if(!resultSet)
      return {nodes:[], edges: []};
    return resultToCytoscape(result, resultSet.data)
  }, [result, resultSet]);

  const tagsRef = useRef<HTMLDivElement>(null);
  const [tagsHeight, setTagsHeight] = useState<number>(0);
  const minTagsHeight = 45;

  useTurnstileEffect(
    () => startExpanded,
    () => setIsExpanded(true),
    () => setExpandSharedResult(false));

  useEffect(() => {
    if(!tagsRef.current)
      return;

    const resizeObserver = new ResizeObserver(() => {
      if(tagsRef.current !== null)
      setTagsHeight(tagsRef.current.clientHeight);
    });

    resizeObserver.observe(tagsRef.current);
    return() => {
      resizeObserver.disconnect();
    };
  },[]);

  const pathCount: number = (!!resultSet) ? getPathCount(resultSet, newPaths) : 0;
  const subjectNode = (!!result) ? getNodeById(resultSet, result.subject) : undefined;
  const objectNode = (!!result) ? getNodeById(resultSet, result.object) : undefined;
  const typeString: string = (!!subjectNode?.types[0]) ? formatBiolinkEntity(subjectNode?.types[0]) : '';
  const nameString: string = (!!result?.drug_name && !!subjectNode) ? formatBiolinkNode(result.drug_name, typeString, subjectNode.species) : '';
  const resultDescription = subjectNode?.descriptions[0];
  const hasSummary = (queryType?.id === 0 && config?.include_summarization) || false;

  const handleEdgeSpecificEvidence = useCallback((edgeIDs: string[], path: Path, pathKey: string) => {
    if(!result)
      return;

    activateEvidence(result, edgeIDs, path, pathKey);
  }, [result, activateEvidence])

  const handleActivateEvidence = useCallback((path: Path, pathKey: string) => {
    if(!!path.subgraph[1])
      activateEvidence(result, [path.subgraph[1]], path, pathKey);
  }, [result, activateEvidence])

  const handleClearSelectedPaths = useCallback(() => {
    setSelectedPaths(null);
  },[]);

  const handleNotesClick = useCallback(async () => {
    await handleNotesClickHook(activateNotes, nameString);
  }, [handleNotesClickHook, activateNotes, nameString]);

  const handleTagClick = (filterID: string, filter: Filter) => {
    let newObj: Filter = {
      name: filter.name,
      negated: false,
      id: filterID,
      value: filter.name
    };
    handleFilter(newObj);
  }


  const handleOpenResultShare = () => {
    setShareResultID(result.id);
    setShareModalOpen(true);
  }

  if(!resultSet)
    return null;

  return (
    <div 
      key={key} 
      className={`${styles.result} result ${isPathfinder ? styles.pathfinder : ''}`} 
      ref={sharedItemRef} 
      data-result-curie={result.subject} 
      data-result-name={nameString}
      data-aras={result.tags ? getARATagsFromResultTags(result.tags).toString() : ''}>
      <div className={styles.top}>
        <div className={`${styles.nameContainer} ${styles.resultSub}`} onClick={handleToggle}>
          <ResultItemName
            isPathfinder={isPathfinder}
            subjectNode={subjectNode}
            objectNode={objectNode}
            item={result}
            activeEntityFilters={activeEntityFilters}
            nameString={nameString}
            ResultItemStyles={styles}
          />
        </div>
        <ResultItemInteractables
          handleBookmarkClick={handleBookmarkClick}
          handleNotesClick={handleNotesClick}
          handleOpenResultShare={handleOpenResultShare}
          hasNotes={itemHasNotes}
          hasUser={!!user}
          isBookmarked={isBookmarked}
          isEven={isEven}
          isExpanded={isExpanded}
          isPathfinder={isPathfinder}
          nameString={nameString}
          result={result}
          hasSummary={hasSummary}
          pk={pk}
          diseaseId={objectNode?.id || ""}
          diseaseName={objectNode?.names[0] || ""}
          diseaseDescription={objectNode?.descriptions[0] || ""}
        />
        <div className={`${styles.evidenceContainer} ${styles.resultSub}`}>
          <span className={styles.evidenceLink}>
            <div>
              {
                evidenceCounts.publicationCount > 0  &&
                <span className={styles.info}>Publications ({evidenceCounts.publicationCount})</span>
              }
              {
                evidenceCounts.clinicalTrialCount > 0  &&
                <span className={styles.info}>Clinical Trials ({evidenceCounts.clinicalTrialCount})</span>
              }
              {
                evidenceCounts.miscCount > 0  &&
                <span className={styles.info}>Misc ({evidenceCounts.miscCount})</span>
              }
              {
                evidenceCounts.sourceCount > 0  &&
                <span className={styles.info}>Sources ({evidenceCounts.sourceCount})</span>
              }
            </div>
          </span>
        </div>
        <div className={`${styles.pathsContainer} ${styles.resultSub}`}>
          <span className={styles.paths}>
            <span className={styles.pathsNum}>{ pathCount } {pathCount > 1 ? "Paths" : "Path"}</span>
          </span>
        </div>
        <div className={`${styles.scoreContainer} ${styles.resultSub}`}>
          <span className={styles.score}>
            <span className={styles.scoreNum}>{resultsComplete ? score === null ? '0.00' : displayScore(score, 2) : "Processing..." }</span>
          </span>
        </div>
        {/* <CSVLink
          className={styles.downloadButton}
          data={csvData}
          filename={`${item.name.toLowerCase()}.csv`}
          onClick={generateCsvFromItem(item, setCsvData)}>
            <Export data-tooltip-id={`csv-tooltip-${nameString}`} aria-describedby={`csv-tooltip-${nameString}`}/>
            <Tooltip id={`csv-tooltip-${nameString}`}>
              <span className={styles.tooltip}>Download a version of this result in CSV format.</span>
            </Tooltip>
        </CSVLink> */}
        <button className={`${styles.accordionButton} ${isExpanded ? styles.open : styles.closed } result-accordion-button`} onClick={handleToggle} data-result-name={nameString}>
          <ChevDown/>
        </button>
      </div>
      <AnimateHeight
        className={`${styles.accordionPanel}
          ${isExpanded ? styles.open : styles.closed }
          ${(roleCount > 0 && !isInUserSave) ? styles.hasTags : ''}
          ${(!!resultDescription && !isPathfinder) ? styles.hasDescription : '' }
          ${!!isInUserSave && styles.inUserSave}
        `}
        duration={500}
        height={height}
        >
        <div className={styles.container}>
          <div>
            {
              result.tags && roleCount > 0 && availableTags &&
              <div className={`${styles.tags} ${tagsHeight > minTagsHeight ? styles.more : '' }`} ref={tagsRef}>
                {
                  Object.keys(result.tags).toSorted((a, b)=>sortTagsBySelected(a, b, activeFilters)).map((fid) => {
                    if (!(filtering.getTagFamily(fid) === filtering.CONSTANTS.FAMILIES.ROLE)) return null;
                    const tag = availableTags[fid];
                    const activeClass = (activeFilters.some((filter)=> filter.id === fid && filter.value === tag.name))
                      ? styles.active
                      : styles.inactive;
                    if(!tag)
                      return null;
                    return(
                      <button key={fid} className={`${styles.tag} ${activeClass}`} onClick={()=>handleTagClick(fid, tag)}>{tag.name} ({tag.count})</button>
                    )
                  })
                }
              </div>
            }
            {
              !!resultDescription && !isPathfinder &&
              <p className={styles.description}>
                <Highlighter
                  highlightClassName="highlight"
                  searchWords={activeEntityFilters}
                  autoEscape={true}
                  textToHighlight={resultDescription}
                />
              </p>
            }
          </div>
        </div>
        <Tabs 
          isOpen 
          className={styles.resultTabs} 
          handleTabSelection={(heading)=>{
              if(heading === "Graph")
                setGraphActive(true);
              else 
                setGraphActive(false);
            }}
          >
            <Tab heading="Paths">
              <PathView
                active={isExpanded}
                activeEntityFilters={activeEntityFilters}
                activeFilters={activeFilters}
                handleEdgeSpecificEvidence={handleEdgeSpecificEvidence}
                handleActivateEvidence={handleActivateEvidence}
                isEven={isEven}
                pathArray={result?.paths}
                pathFilterState={pathFilterState}
                pk={pk ? pk : ""}
                resultID={result.id}
                selectedPaths={selectedPaths}
                setShowHiddenPaths={setShowHiddenPaths}
                showHiddenPaths={showHiddenPaths}
              />
            </Tab>
            <Tab heading="Graph">
              <Suspense fallback={<LoadingBar useIcon reducedPadding />}>
                <GraphView
                  graph={graph}
                  result={result}
                  resultSet={resultSet}
                  clearSelectedPaths={handleClearSelectedPaths}
                  active={graphActive}
                  zoomKeyDown={zoomKeyDown}
                />
              </Suspense>
            </Tab>
        </Tabs>
      </AnimateHeight>
      <BookmarkConfirmationModal
        isOpen={bookmarkRemovalConfirmationModalOpen}
        onApprove={handleBookmarkRemovalApproval}
        onClose={()=>{
          setBookmarkRemovalConfirmationModalOpen(false);
          resetRemovalApproval();
        }}
      />
    </div>
  );
}

export default ResultItem;
