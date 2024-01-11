import PathObject from '../PathObject/PathObject';
import Tooltip from '../Tooltip/Tooltip';
import ResearchMultiple from '../../Icons/research-multiple.svg?react';

const SupportPath = ({ dataObj }) => {

  const pathViewStyles = dataObj.pathViewStyles;
  const tooltipID = dataObj.tooltipID;
  const key = dataObj.key;
  const supportPath = dataObj.supportPath;
  const selectedPaths = dataObj.selectedPaths;
  // const pathToDisplay = dataObj.pathToDisplay;
  const handleActivateEvidence = dataObj.handleActivateEvidence;
  const handleNameClick = dataObj.handleNameClick;
  const handleEdgeClick = dataObj.handleEdgeClick;
  const handleTargetClick = dataObj.handleTargetClick;
  const activeStringFilters = dataObj.activeStringFilters;

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
        className={`${pathViewStyles.tableItem} ${selectedPaths.size > 0 && !supportPath.highlighted ? pathViewStyles.unhighlighted : 'asdfasdfasdf'}`} 
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