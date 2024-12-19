import { FC } from 'react';
import PathObject from '../PathObject/PathObject';
import Tooltip from '../Tooltip/Tooltip';
import ResearchMultiple from '../../Icons/Queries/Evidence.svg?react';
import { PathFilterState, Path, ResultNode, Filter } from '../../Types/results';
import { numberToWords } from '../../Utilities/utilities';
import LastViewedTag from '../LastViewedTag/LastViewedTag';
import { useLastViewedPath } from '../../Utilities/customHooks';


interface SupportPathProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  character: string;
  handleEdgeClick: (edgeID: string, pathID: string) => void;
  handleNodeClick: (name: ResultNode) => void;
  handleActivateEvidence: (pathID: string) => void;
  path: Path;
  pathFilterState: PathFilterState;
  pathViewStyles: {[key: string]: string;} | null;
  pk: string;
  selectedPaths: Set<Path> | null;
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
  selectedPaths }) => {

  const { lastViewedPathID } = useLastViewedPath(); 

  const tooltipID = path.id;

  return (
    <>
      {
        path !== null &&
        <div className={`${!!pathViewStyles && pathViewStyles.formattedPath} ${!!pathViewStyles && pathViewStyles.supportPath}`} key={path.id}>
          {
            lastViewedPathID === path.id &&
            <LastViewedTag/>
          }
          <span className={`${!!pathViewStyles &&pathViewStyles.num}`}>
            { character }
          </span>
          <button
            onClick={()=>(path?.id) && handleActivateEvidence(path.id)}
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
            className={`path ${numberToWords(path.subgraph.length)}  
            ${!!pathViewStyles && pathViewStyles.tableItem} 
            ${selectedPaths !== null && selectedPaths.size > 0 && !path.highlighted ? !!pathViewStyles && pathViewStyles.unhighlighted : ''} 
            ${!!pathFilterState && !!path?.id && pathFilterState[path.id] ? !!pathViewStyles && pathViewStyles.filtered : ''}`}
            >
            {
              path.subgraph.map((supportItemID, i) => {
                let pathKey = `${supportItemID}_${i}`;
                return (
                  <PathObject
                    pathViewStyles={pathViewStyles}
                    index={i}
                    pathID={(!!path?.id) ? path.id : ""}
                    id={supportItemID}
                    key={pathKey}
                    handleNodeClick={handleNodeClick}
                    // handleEdgeClick={(edgeID)=>handleEdgeClick(edgeID, supportItemID)}
                    handleEdgeClick={handleEdgeClick}
                    handleActivateEvidence={handleActivateEvidence}
                    activeEntityFilters={activeEntityFilters}
                    activeFilters={activeFilters}
                    pathFilterState={pathFilterState}
                    selectedPaths={selectedPaths}
                    pk={pk}
                  />
                );
              })
            }
          </div>
        </div>
      }
    </>
  );
}

export default SupportPath;
