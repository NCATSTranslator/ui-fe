import { FC, RefObject } from "react";
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import Alert from '@/assets/icons/status/Alerts/Info.svg?react';
import ArrowUp from '@/assets/icons/directional/Arrows/Arrow Up.svg?react';

interface ResultListTableHeadProps {
  parentStyles: {[key: string]: string};
  currentSortString: RefObject<string | number>;
  defaultSortString: string;
  isSortedByName: boolean | null;
  isSortedByEvidence: boolean | null;
  isSortedByPaths: boolean | null;
  handleUpdateResults: () => void
}

const getNextSortString = (
  isSorted: boolean | null,
  firstDir: boolean,
  lowHighString: string,
  highLowString: string,
  defaultSortString: string,
): string => {
  if (isSorted === null) return lowHighString;
  if (isSorted === firstDir) return highLowString;
  return defaultSortString;
};

const ResultListTableHead: FC<ResultListTableHeadProps> = ({ 
  currentSortString,
  defaultSortString,
  handleUpdateResults,
  isSortedByName,
  isSortedByEvidence,
  isSortedByPaths,
  parentStyles }) => {

  return(
    <div className={`${parentStyles.tableHead}`}>
      <div
        className={`${parentStyles.head} ${parentStyles.nameHead} ${isSortedByName ? parentStyles.true : (isSortedByName === null) ? '' : parentStyles.false}`}
        onClick={()=>{
          const sortString = getNextSortString(isSortedByName, true, 'nameLowHigh', 'nameHighLow', defaultSortString);
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
          const sortString = getNextSortString(isSortedByEvidence, false, 'evidenceHighLow', 'evidenceLowHigh', defaultSortString);
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
          const sortString = getNextSortString(isSortedByPaths, false, 'pathsHighLow', 'pathsLowHigh', defaultSortString);
          currentSortString.current = sortString;
          handleUpdateResults();
        }}
        data-tooltip-id="paths-tooltip"
      >
        Paths
        <Alert/>
        <ArrowUp className={parentStyles.chev}/>
        <Tooltip id="paths-tooltip" place="bottom">
          <span className={parentStyles.scoreSpan}>Number of paths that support the result.</span>
        </Tooltip>
      </div>
      <div></div>
    </div>
  )
}

export default ResultListTableHead;
