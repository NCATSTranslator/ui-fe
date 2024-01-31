import { memo } from 'react';
import PathObject from '../PathObject/PathObject';
import Tooltip from '../Tooltip/Tooltip';
import ResearchMultiple from '../../Icons/research-multiple.svg?react';

const SupportPath = ({ dataObj }) => {

  const pathViewStyles = dataObj.pathViewStyles;
  const tooltipID = dataObj.tooltipID;
  const key = dataObj.key;
  const supportPath = dataObj.supportPath;
  const selectedPaths = dataObj.selectedPaths;
  const handleActivateEvidence = ()=>dataObj.handleActivateEvidence(supportPath);
  const handleNameClick = dataObj.handleNameClick;
  const handleEdgeClick = dataObj.handleEdgeClick;
  const handleTargetClick = dataObj.handleTargetClick;
  const activeStringFilters = dataObj.activeStringFilters;
  
  return (
    <div className={`${pathViewStyles.formattedPath} ${pathViewStyles.supportPath}`} key={key}>
      <button 
        onClick={handleActivateEvidence}
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
        className={`${pathViewStyles.tableItem} ${selectedPaths.size > 0 && !supportPath.highlighted ? pathViewStyles.unhighlighted : ''}`} 
        key={key}
        > 
        {
          supportPath.path.subgraph.map((supportItem, i) => {
            let pathKey = `${key}_${i}`;
            let supportItemHasSupport = supportItem.inferred;
            return (
              <PathObject 
                pathObject={supportItem} 
                id={pathKey}
                key={pathKey}
                handleNameClick={handleNameClick}
                handleEdgeClick={(edge)=>handleEdgeClick(edge, supportPath)}
                handleTargetClick={handleTargetClick}
                activeStringFilters={activeStringFilters}
                hasSupport={supportItemHasSupport}
              />
            );
          })
        }
      </div>
    </div>
  );
}

const areEqualProps = (prevProps, nextProps) => {
  const prevDataKeys = Object.keys(prevProps.dataObj);
  const nextDataKeys = Object.keys(nextProps.dataObj);

  if (prevDataKeys.length !== nextDataKeys.length) {
    return false;
  }

  for (const key of prevDataKeys) {
    if (prevProps.dataObj[key] !== nextProps.dataObj[key]) {
      return false;
    }
  }

  // If none of the above conditions are met, props are equal
  return true;
};

export default memo(SupportPath, areEqualProps);