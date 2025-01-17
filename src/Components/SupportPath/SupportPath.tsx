import { FC } from 'react';
import PathObject from '../PathObject/PathObject';
import Tooltip from '../Tooltip/Tooltip';
import ResearchMultiple from '../../Icons/Queries/Evidence.svg?react';
import { PathFilterState, Path, ResultNode, Filter } from '../../Types/results';
import { getIsPathFiltered, numberToWords } from '../../Utilities/utilities';
import LastViewedTag from '../LastViewedTag/LastViewedTag';
import { useLastViewedPath } from '../../Utilities/customHooks';


interface SupportPathProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  character: string;
  handleEdgeClick: (edgeID: string, path: Path) => void;
  handleNodeClick: (name: ResultNode) => void;
  handleActivateEvidence: (path: Path) => void;
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
  path, 
  pathFilterState, 
  pathViewStyles, 
  pk,
  selectedPaths,
  showHiddenPaths }) => {

  const { lastViewedPathID } = useLastViewedPath(); 

  const tooltipID = path.id;

  const isPathFiltered = getIsPathFiltered(path, pathFilterState);
  if(!path.id || (isPathFiltered && !showHiddenPaths)) 
    return null;

  return (
    <>
      {
        path !== null &&
        <div className={`${!!pathViewStyles && pathViewStyles.formattedPath}`} key={path.id}>
          {
            lastViewedPathID === path.id &&
            <LastViewedTag/>
          }
          <span className={`${!!pathViewStyles &&pathViewStyles.num}`}>
            { character }
          </span>
          <button
            onClick={()=>handleActivateEvidence(path)}
            className={`${!!pathViewStyles && pathViewStyles.pathEvidenceButton}`}
            data-tooltip-id={`${tooltipID}`}
            >
              <ResearchMultiple />
          </button>
          <Tooltip
            id={`${tooltipID}`}
            >
              <span>View evidence for this path.</span>
          </Tooltip>
          <div
            data-path-id={`${path.id || ""}`}
            className={`path ${numberToWords(path.subgraph.length)}  
            ${!!pathViewStyles && pathViewStyles.tableItem} 
            ${selectedPaths !== null && selectedPaths.size > 0 && !path.highlighted ? !!pathViewStyles && pathViewStyles.unhighlighted : ''} 
            ${(isPathFiltered && !!pathViewStyles) ? pathViewStyles.filtered : ''}`}
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
                        isEven={false}
                        path={path}
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
                        isEven={false}
                        path={path}
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
