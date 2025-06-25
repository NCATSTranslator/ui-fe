import { FC } from 'react';
import PathObject from '@/features/ResultItem/components/PathObject/PathObject';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import ResearchMultiple from '@/assets/icons/Queries/Evidence.svg?react';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { PathFilterState, Path, ResultNode } from '@/features/ResultList/types/results.d';
import { joinClasses, numberToWords } from '@/features/Common/utils/utilities';
import { extractEdgeIDsFromSubgraph, getIsPathFiltered } from '@/features/ResultItem/utils/utilities';
import LastViewedTag from '@/features/ResultItem/components/LastViewedTag/LastViewedTag';
import { useLastViewedPath, useSeenStatus, useSupportPathKey } from '@/features/ResultItem/hooks/resultHooks';
import PathArrow from '@/assets/icons/Connectors/PathArrow.svg?react';

interface SupportPathProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  character: string;
  handleEdgeClick: (edgeIDs: string[], path: Path, pathKey: string) => void;
  handleNodeClick: (name: ResultNode) => void;
  handleActivateEvidence: (path: Path, pathKey: string) => void;
  isEven: boolean;
  path: Path;
  pathFilterState: PathFilterState;
  pathViewStyles: {[key: string]: string;} | null;
  pk: string;
  selectedPaths: Set<Path> | null;
  showHiddenPaths: boolean;
}

const SupportPath: FC<SupportPathProps> = ({ 
  activeEntityFilters, 
  activeFilters, 
  character,
  handleEdgeClick, 
  handleNodeClick, 
  handleActivateEvidence,
  isEven = false,
  path,
  pathFilterState, 
  pathViewStyles, 
  pk,
  selectedPaths,
  showHiddenPaths }) => {

  const { lastViewedPathID, setLastViewedPathID } = useLastViewedPath();
  const { isPathSeen } = useSeenStatus(pk);
  const parentPathKey = useSupportPathKey();
  const fullPathKey = `${parentPathKey}.${character}`;
  const tooltipID = path.id;
  const isPathFiltered = getIsPathFiltered(path, pathFilterState);
  const edgeIds = extractEdgeIDsFromSubgraph(path.subgraph);
  const isSeen = isPathSeen(edgeIds);
  if(!path.id || (isPathFiltered && !showHiddenPaths)) 
    return null;

  const formattedPathClass = joinClasses(
    !!pathViewStyles && pathViewStyles.formattedPath,
    (!!lastViewedPathID && lastViewedPathID === path.id && pathViewStyles) && pathViewStyles.lastViewed,
    (isPathFiltered && !!pathViewStyles) && pathViewStyles.filtered,
    (isEven && !!pathViewStyles) && pathViewStyles.isEven,
    (isSeen && pathViewStyles) && pathViewStyles.seenPath
  );
  const pathClass = joinClasses(
    'path',
    numberToWords(path.subgraph.length),
    !!pathViewStyles && pathViewStyles.tableItem,
    (selectedPaths !== null && selectedPaths.size > 0 && !path.highlighted && !!pathViewStyles) && pathViewStyles.unhighlighted
  )
  return (
    <>
      {
        path !== null &&
        <div 
          className={formattedPathClass} 
          key={path.id}
          >
          {
            !!lastViewedPathID && lastViewedPathID === path.id &&
            <LastViewedTag/>
          }
          <button
            onClick={()=>{
              if(!!path?.id) {
                setLastViewedPathID(path.id);
                handleActivateEvidence(path, fullPathKey);
              }
            }}
            className={`${!!pathViewStyles && pathViewStyles.pathEvidenceButton}`}
            data-tooltip-id={`${tooltipID}`}
            >
              <div className={`${!!pathViewStyles && pathViewStyles.icon}`}>
                <ResearchMultiple />
              </div>
              <span className={`${!!pathViewStyles && pathViewStyles.num}`}>
                <span className={`${!!pathViewStyles && pathViewStyles.val}`}>
                  { character }
                </span>
                <PathArrow/>
              </span>
          </button>
          <Tooltip
            id={`${tooltipID}`}
            >
              <span>View evidence for this path.</span>
          </Tooltip>
          <div
            data-path-id={`${path.id || ""}`}
            className={pathClass}
            >
            {
              !!path?.compressedSubgraph
              ?
                path.compressedSubgraph.map((subgraphItemID, i) => {
                  let key = (Array.isArray(subgraphItemID)) ? subgraphItemID[0] : subgraphItemID;
                  if(path.id === undefined)
                    return null;
                  return (
                    <>
                      <PathObject
                        pathViewStyles={pathViewStyles}
                        index={i}
                        isEven={isEven}
                        path={path}
                        parentPathKey={character}
                        id={subgraphItemID}
                        key={key}
                        handleActivateEvidence={handleActivateEvidence}
                        handleEdgeClick={handleEdgeClick}
                        handleNodeClick={handleNodeClick}
                        activeEntityFilters={activeEntityFilters}
                        selectedPaths={selectedPaths}
                        pathFilterState={pathFilterState}
                        activeFilters={activeFilters}
                        pk={pk}
                        showHiddenPaths={showHiddenPaths}
                      />
                    </>
                  )
                }) 
              :
                path.subgraph.map((subgraphItemID, i) => {
                  if(path.id === undefined)
                    return null;
                  return (
                    <>
                      <PathObject
                        pathViewStyles={pathViewStyles}
                        index={i}
                        isEven={isEven}
                        path={path}
                        parentPathKey={character}
                        id={subgraphItemID}
                        key={subgraphItemID}
                        handleActivateEvidence={handleActivateEvidence}
                        handleEdgeClick={handleEdgeClick}
                        handleNodeClick={handleNodeClick}
                        activeEntityFilters={activeEntityFilters}
                        selectedPaths={selectedPaths}
                        pathFilterState={pathFilterState}
                        activeFilters={activeFilters}
                        pk={pk}
                      />
                    </>
                  )
                })
            }
          </div>
        </div>
      }
    </>
  );
}

export default SupportPath;
