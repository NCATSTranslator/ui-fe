import { FC, MutableRefObject } from "react";
import Tooltip from '../Tooltip/Tooltip';
import Alert from '../../Icons/Status/Alerts/Info.svg?react';
import ChevUp from '../../Icons/Directional/Chevron/Chevron Up.svg?react';

interface ResultsListTableHeadProps {
  parentStyles: {[key: string]: string};
  currentSortString: MutableRefObject<string | number>;
  isSortedByName: boolean | null;
  isSortedByEvidence: boolean | null;
  isSortedByPaths: boolean | null;
  isSortedByScore: boolean | null;
  isPathfinder: boolean;
  handleUpdateResults: () => any
}

const ResultsListTableHead: FC<ResultsListTableHeadProps> = ({ parentStyles, currentSortString, isSortedByName, isSortedByEvidence, isSortedByPaths, isSortedByScore, isPathfinder, handleUpdateResults }) => {

  return(
    <div className={`${parentStyles.tableHead}`}>
      <div
        className={`${parentStyles.head} ${parentStyles.nameHead} ${isSortedByName ? parentStyles.true : (isSortedByName === null) ? '' : parentStyles.false}`}
        onClick={()=>{
          let sortString = (isSortedByName === null) ? 'nameLowHigh' : (isSortedByName) ? 'nameHighLow' : 'nameLowHigh';
          currentSortString.current = sortString;
          handleUpdateResults();
        }}
      >
        Name
        <ChevUp className={parentStyles.chev}/>
      </div>
      <div></div>
      <div
        className={`${parentStyles.head} ${parentStyles.evidenceHead} ${isSortedByEvidence ? parentStyles.true : (isSortedByEvidence === null) ? '': parentStyles.false}`}
        onClick={()=>{
          let sortString = (isSortedByEvidence === null) ? 'evidenceHighLow' : (isSortedByEvidence) ? 'evidenceHighLow' : 'evidenceLowHigh';
          currentSortString.current = sortString;
          handleUpdateResults();
        }}
      >
        Evidence
        <ChevUp className={parentStyles.chev}/>
      </div>
      <div
        className={`${parentStyles.head} ${parentStyles.pathsHead} ${isSortedByPaths ? parentStyles.true : (isSortedByPaths === null) ? '': parentStyles.false}`}
        onClick={()=>{
          let sortString = (isSortedByPaths === null) ? 'pathsHighLow' : (isSortedByPaths) ? 'pathsHighLow' : 'pathsLowHigh';
          currentSortString.current = sortString;
          handleUpdateResults();
        }}
        data-tooltip-id="paths-tooltip"
      >
        Paths
        <Alert/>
        <ChevUp className={parentStyles.chev}/>
        <Tooltip id="paths-tooltip">
          <span className={parentStyles.scoreSpan}>Each path represents a discrete series of relationships that connect the result to the searched-for entity.</span>
        </Tooltip>
      </div>
      {
        !isPathfinder &&
        <div
          className={`${parentStyles.head} ${parentStyles.scoreHead} ${isSortedByScore ? parentStyles.true : (isSortedByScore === null) ? '': parentStyles.false}`}
          onClick={()=>{
            let sortString = (isSortedByScore === null) ? 'scoreHighLow' : (isSortedByScore) ? 'scoreHighLow' : 'scoreLowHigh';
            currentSortString.current = sortString;
            handleUpdateResults();
          }}
          data-tooltip-id="score-tooltip"
        >
          Score
          <Alert/>
          <ChevUp className={parentStyles.chev}/>
          <Tooltip id="score-tooltip">
            <span className={parentStyles.scoreSpan}>Multimodal calculation considering strength of relationships supporting the result. Scores range from 0 to 5 and may change as new results are added. Scores will be displayed once all results have been loaded.</span>
          </Tooltip>
        </div>
      }
      <div></div>
    </div>
  )
}

export default ResultsListTableHead;