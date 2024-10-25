import { memo, FC } from 'react';
import PathObject from '../PathObject/PathObject';
import Tooltip from '../Tooltip/Tooltip';
import ResearchMultiple from '../../Icons/Queries/Evidence.svg?react';
import { SupportDataObject, PathFilterState } from '../../Types/results';
import { isFormattedEdgeObject, numberToWords } from '../../Utilities/utilities';
import LastViewedTag from '../LastViewedTag/LastViewedTag';
import { useLastViewedPath } from '../../Utilities/customHooks';

interface SupportPathProps {
  dataObj: SupportDataObject;
  character: string;
  pathFilterState: PathFilterState
}

const SupportPath: FC<SupportPathProps> = ({ dataObj, character, pathFilterState }) => {

  const pathViewStyles = dataObj.pathViewStyles;
  const tooltipID = dataObj.tooltipID;
  const key = dataObj.key;
  const supportPath = dataObj.supportPath;
  const selectedPaths = dataObj.selectedPaths;
  const handleActivateEvidence = (!!supportPath) ? ()=>dataObj.handleActivateEvidence(supportPath): ()=>console.warn("no support path provided");
  const handleNameClick = dataObj.handleNameClick;
  const handleEdgeClick = dataObj.handleEdgeClick;
  const handleTargetClick = dataObj.handleTargetClick;
  const activeEntityFilters = dataObj.activeEntityFilters;
  const { lastViewedPathID } = useLastViewedPath();

  return (
    <>
      {
        supportPath !== null &&
        <div className={`${!!pathViewStyles && pathViewStyles.formattedPath} ${!!pathViewStyles && pathViewStyles.supportPath}`} key={key}>
          {
            lastViewedPathID === supportPath.id &&
            <LastViewedTag/>
          }
          <span className={`${!!pathViewStyles &&pathViewStyles.num}`}>
            { character }
          </span>
          <button
            onClick={handleActivateEvidence}
            className={`${!!pathViewStyles && pathViewStyles.pathEvidenceButton}`}
            data-tooltip-id={`${tooltipID}-${key}`}
            >
              <ResearchMultiple />
          </button>
          <Tooltip
            id={`${tooltipID}-${key}`}
            >
              <span>View evidence for this path.</span>
          </Tooltip>
          <div
            className={`path ${numberToWords(supportPath.path.subgraph.length)}  ${!!pathViewStyles && pathViewStyles.tableItem} ${selectedPaths !== null && selectedPaths.size > 0 && !supportPath.highlighted ? !!pathViewStyles && pathViewStyles.unhighlighted : ''} ${!!pathFilterState && pathFilterState[supportPath.id] ? !!pathViewStyles && pathViewStyles.filtered : ''}`}
            key={key}
            >
            {
              supportPath.path.subgraph.map((supportItem, i) => {
                let pathKey = `${key}_${i}`;
                let supportItemHasSupport = (isFormattedEdgeObject(supportItem))? supportItem.inferred : false;
                let supportDataObject: SupportDataObject | null = (supportItemHasSupport)
                ? {
                    key: key,
                    pathItem: supportItem,
                    pathViewStyles: pathViewStyles,
                    selectedPaths: selectedPaths,
                    pathToDisplay: supportPath,
                    handleActivateEvidence: handleActivateEvidence,
                    handleNameClick: handleNameClick,
                    handleEdgeClick: handleEdgeClick,
                    handleTargetClick: handleTargetClick,
                    activeEntityFilters: activeEntityFilters,
                    tooltipID: null,
                    supportPath: null
                  }
                : null;
                return (
                  <PathObject
                    pathObjectContainer={supportPath}
                    pathObject={supportItem}
                    id={pathKey}
                    key={pathKey}
                    handleNameClick={handleNameClick}
                    handleEdgeClick={(edge)=>handleEdgeClick(edge, supportPath)}
                    handleTargetClick={handleTargetClick}
                    activeEntityFilters={activeEntityFilters}
                    hasSupport={supportItemHasSupport}
                    supportDataObject={supportDataObject}
                    pathFilterState={pathFilterState}
                    pathViewStyles={pathViewStyles}
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

const areEqualProps = (prevProps: any, nextProps: any) => {
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
// export default SupportPath;
