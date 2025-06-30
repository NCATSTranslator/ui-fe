import { FC, MutableRefObject } from "react";
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import Alert from '@/assets/icons/Status/Alerts/Info.svg?react';
import ArrowUp from '@/assets/icons/Directional/Arrows/Arrow Up.svg?react';

interface ResultListTableHeadProps {
  parentStyles: {[key: string]: string};
  currentSortString: MutableRefObject<string | number>;
  isSortedByName: boolean | null;
  isSortedByEvidence: boolean | null;
  isSortedByPaths: boolean | null;
  isSortedByScore: boolean | null;
  isPathfinder: boolean;
  handleUpdateResults: () => any
}

const ResultListTableHead: FC<ResultListTableHeadProps> = ({ 
  currentSortString, 
  handleUpdateResults,
  isPathfinder, 
  isSortedByName, 
  isSortedByEvidence, 
  isSortedByPaths, 
  isSortedByScore,
  parentStyles }) => {

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
        <ArrowUp className={parentStyles.chev}/>
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
        <ArrowUp className={parentStyles.chev}/>
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
        <ArrowUp className={parentStyles.chev}/>
        <Tooltip id="paths-tooltip">
          <span className={parentStyles.scoreSpan}>Number of paths that support the result.</span>
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
          <ArrowUp className={parentStyles.chev}/>
          <Tooltip id="score-tooltip">
            <span className={parentStyles.scoreSpan}>A result's score is a multimodal calculation considering the strength of relationships supporting it. Scores range from 0 to 5 and are shown once all results are synced.</span>
          </Tooltip>
        </div>
      }
      <div></div>
    </div>
  )
}

export default ResultListTableHead;