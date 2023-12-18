import PathObject from '../PathObject/PathObject';
import Tooltip from '../Tooltip/Tooltip';
import ResearchMultiple from '../../Icons/research-multiple.svg?react';

const SupportPath = ({supportPathDataObject}) => {
  
  const pathViewStyles = supportPathDataObject.pathViewStyles;
  const tooltipID = supportPathDataObject.tooltipID;
  const key = supportPathDataObject.key;
  const supportPath = supportPathDataObject.supportPath;
  const selectedPaths = supportPathDataObject.selectedPaths;
  const pathToDisplay = supportPathDataObject.pathToDisplay;
  const handleActivateEvidence = supportPathDataObject.handleActivateEvidence;
  const handleNameClick = supportPathDataObject.handleNameClick;
  const handleEdgeClick = supportPathDataObject.handleEdgeClick;
  const handleTargetClick = supportPathDataObject.handleTargetClick;
  const activeStringFilters = supportPathDataObject.activeStringFilters;

  return (
    <div className={`${pathViewStyles.formattedPath} ${pathViewStyles.supportPath}`} key={key}>
      <button 
        onClick={()=>handleActivateEvidence(supportPath)}
        className={pathViewStyles.pathEvidenceButton}
        data-tooltip-id={tooltipID}
        >
          <ResearchMultiple />
      </button>
      <Tooltip 
        id={tooltipID}
        >
          <span>View evidence for this path.</span>
      </Tooltip>
      <div 
        className={`${pathViewStyles.tableItem} ${selectedPaths.size > 0 && !pathToDisplay.highlighted ? pathViewStyles.unhighlighted : ''}`} 
        key={key}
        > 
        {
          supportPath.path.subgraph.map((supportItem, i) => {
            let pathKey = `${key}_${i}`;
            return (
              <PathObject 
                pathObject={supportItem} 
                id={pathKey}
                key={pathKey}
                handleNameClick={handleNameClick}
                handleEdgeClick={(edge)=>handleEdgeClick(edge, supportPath)}
                handleTargetClick={handleTargetClick}
                activeStringFilters={activeStringFilters}
              />
            );
          })
        }
      </div>
    </div>
  );
}

export default SupportPath;