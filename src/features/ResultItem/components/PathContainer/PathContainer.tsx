import { FC, memo } from 'react';
import LastViewedTag from '@/features/ResultItem/components/LastViewedTag/LastViewedTag';
import PathObject from '@/features/ResultItem/components/PathObject/PathObject';
import { Path, ResultEdge, ResultNode } from '@/features/ResultList/types/results';
import { PathFilterState } from '@/features/ResultList/types/results';
import { RefObject } from 'react';
import { extractEdgeIDsFromSubgraph, getIsPathFiltered } from '@/features/ResultItem/utils/utilities';
import { useLastViewedPath, useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { numberToWords } from '@/features/Core/utils/stringFormatters';
import CompressedPathObjects from '@/features/ResultItem/components/PathContainer/CompressedPathObjects';
import PathEvidenceButton from '@/features/ResultItem/components/PathContainer/PathEvidenceButton';

interface PathContainerProps {
  path: Path;
  inModal: boolean;
  compressedSubgraph?: false | (ResultEdge | ResultNode | ResultEdge[])[];
  handleEdgeClick?: (edgeIDs: string[], path: Path) => void;
  activeEntityFilters: string[];
  pathFilterState: PathFilterState;
  pk: string;
  showHiddenPaths: boolean;
  selectedEdgeRef?: RefObject<HTMLElement | null>;
  selectedEdge?: ResultEdge | null;
  isEven: boolean;
  styles: { [key: string]: string;};
  /** Position of this path in the full collection, or -1 when not found. */
  pathIndex: number;
}

const PathContainer: FC<PathContainerProps> = ({
  path,
  inModal,
  compressedSubgraph,
  handleEdgeClick,
  activeEntityFilters,
  pathFilterState,
  pk,
  showHiddenPaths,
  selectedEdgeRef,
  selectedEdge,
  isEven,
  styles,
  pathIndex,
}) => {
  const { lastViewedPathID } = useLastViewedPath();
  const isLastViewed = !!lastViewedPathID && lastViewedPathID === path.id;
  const isPathFiltered = getIsPathFiltered(path, pathFilterState);
  const edgeIds = extractEdgeIDsFromSubgraph(path.subgraph);
  const { isPathSeen } = useSeenStatus(pk);
  const isSeen = isPathSeen(edgeIds);
  const parentPathKey = (pathIndex + 1).toString();
  const subgraphToMap = path.compressedSubgraph?.length ? path.compressedSubgraph : path.subgraph;
  const inCompressedModal = !!(inModal && compressedSubgraph);

  // Return null if path is filtered and hidden paths are not shown
  if (isPathFiltered && !showHiddenPaths)
    return null;
  
  const formattedPathClass = joinClasses(
    styles.formattedPath,
    isLastViewed && styles.lastViewed,
    isEven && styles.isEven,
    isPathFiltered && styles.filtered,
    isSeen && styles.seenPath
  );
  const pathClass = joinClasses(
    inCompressedModal && styles.compressedTableItem,
    styles.tableItem,
    'path',
    numberToWords(path.subgraph.length)
  );

  return (
      <div className={formattedPathClass}>
        {
          (isLastViewed || inModal) &&
          <LastViewedTag inModal={inModal} inGroup={inCompressedModal} />
        }
        <PathEvidenceButton path={path} pk={pk} pathIndex={pathIndex} styles={styles} />
        <div data-path-id={`${path.id || ""}`} className={pathClass}>
          {inCompressedModal && compressedSubgraph ? (
            <CompressedPathObjects
              compressedSubgraph={compressedSubgraph}
              path={path}
              parentPathKey={parentPathKey}
              pk={pk}
              handleEdgeClick={handleEdgeClick}
              selectedEdge={selectedEdge}
              selectedEdgeRef={selectedEdgeRef}
              styles={styles}
            />
          ) : (
            subgraphToMap.map((subgraphItemID: string | string[], i: number) => {
              const selected = !!selectedEdge && (selectedEdge.id === subgraphItemID);
              const key = (Array.isArray(subgraphItemID)) ? subgraphItemID[0] : subgraphItemID;

              if (path.id === undefined)
                return null;
              return (
                <PathObject
                  pathViewStyles={styles}
                  index={i}
                  isEven={isEven}
                  inModal={inModal}
                  path={path}
                  parentPathKey={parentPathKey}
                  id={subgraphItemID}
                  key={key}
                  handleEdgeClick={handleEdgeClick}
                  activeEntityFilters={activeEntityFilters}
                  pk={pk}
                  selected={selected}
                  selectedEdgeRef={selectedEdgeRef}
                />
              )
            })
          )}
        </div>
      </div>
  );
};

export default memo(PathContainer);