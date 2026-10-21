import { FC } from 'react';
import ResultItem from '@/features/ResultItem/components/ResultItem/ResultItem';
import { getResultById } from '@/features/ResultList/slices/resultsSlice';
import { Result, ResultSet, PathFilterState } from '@/features/ResultList/types/results.d';
import { SaveGroup } from '@/features/UserAuth/utils/userApi';

interface ResultListRowsProps {
  parentStyles: { [key: string]: string };
  resultSet: ResultSet | null;
  displayedResults: Result[];
  pathFilterState: PathFilterState | null;
  userSaves: SaveGroup | null;
  /** Index of the first displayed result within the full list */
  itemOffset: number;
  isLoading: boolean;
  isError: boolean;
}

/** The current page of result rows, or the error / empty message in their place. */
const ResultListRows: FC<ResultListRowsProps> = ({ parentStyles, resultSet, displayedResults, pathFilterState, userSaves, itemOffset, isLoading, isError }) => {
  if (isError)
    return <h5 className={parentStyles.errorText}>There was an error when processing your query. Please try again.</h5>;
  if (isLoading)
    return null;
  if (displayedResults.length === 0)
    return <h5 className={parentStyles.errorText}>No results available.</h5>;

  return (
    <>
      {displayedResults.map((item, i) => {
        const result = getResultById(resultSet, item.id);
        if (!result || !pathFilterState)
          return null;
        return (
          <ResultItem
            key={item.id}
            result={result}
            isEven={i % 2 !== 0}
            bookmarkItem={userSaves?.saves.get(item.id) ?? null}
            // Rank across the whole list, not the page, so analytics can tell
            // "first result" from "first result on page 4".
            resultRank={itemOffset + i + 1}
          />
        );
      })}
    </>
  );
};

export default ResultListRows;
