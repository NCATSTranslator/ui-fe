import { FC, RefObject } from "react";
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import Alert from '@/assets/icons/status/Alerts/Info.svg?react';
import ArrowUp from '@/assets/icons/directional/Arrows/Arrow Up.svg?react';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

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

/**
 * Split a sort string like 'evidenceHighLow' into the field and direction that
 * GA4 reports on. Tracking happens here rather than in useSortState because
 * getSortedResults also runs on filter changes and re-renders, which are not
 * user-initiated sorts.
 */
const SORT_DIRECTIONS: Record<string, 'asc' | 'desc'> = { LowHigh: 'asc', HighLow: 'desc' };

const trackSort = (sortString: string): void => {
  const match = /^(.*?)(LowHigh|HighLow)$/.exec(sortString);
  trackEvent('results_sorted', {
    sort_field: match ? match[1] : sortString,
    sort_direction: match ? SORT_DIRECTIONS[match[2]] : 'default',
  });
};

const ResultListTableHead: FC<ResultListTableHeadProps> = ({
  currentSortString,
  defaultSortString,
  handleUpdateResults,
  isSortedByName,
  isSortedByEvidence,
  isSortedByPaths,
  parentStyles }) => {

  const handleSort = (isSorted: boolean | null, firstDir: boolean, lowHighString: string, highLowString: string) => {
    const sortString = getNextSortString(isSorted, firstDir, lowHighString, highLowString, defaultSortString);
    currentSortString.current = sortString;
    trackSort(sortString);
    handleUpdateResults();
  };

  const getSortClass = (isSorted: boolean | null) => {
    if (isSorted === null) return '';
    return isSorted ? parentStyles.true : parentStyles.false;
  };

  return(
    <div className={`${parentStyles.tableHead}`}>
      <div
        className={`${parentStyles.head} ${parentStyles.nameHead} ${getSortClass(isSortedByName)}`}
        onClick={() => handleSort(isSortedByName, true, 'nameLowHigh', 'nameHighLow')}
      >
        Name
        <ArrowUp className={parentStyles.chev}/>
      </div>
      <div></div>
      <div
        className={`${parentStyles.head} ${parentStyles.evidenceHead} ${getSortClass(isSortedByEvidence)}`}
        onClick={() => handleSort(isSortedByEvidence, false, 'evidenceHighLow', 'evidenceLowHigh')}
      >
        Evidence
        <ArrowUp className={parentStyles.chev}/>
      </div>
      <div
        className={`${parentStyles.head} ${parentStyles.pathsHead} ${getSortClass(isSortedByPaths)}`}
        onClick={() => handleSort(isSortedByPaths, false, 'pathsHighLow', 'pathsLowHigh')}
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
