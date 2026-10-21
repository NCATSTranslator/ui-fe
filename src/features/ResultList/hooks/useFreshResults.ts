import { useCallback, useState, RefObject } from 'react';
import { Result, ResultSet } from '@/features/ResultList/types/results.d';

/**
 * Holds a result set that arrives while results are already on screen, so the
 * list isn't overwritten underneath the user until they ask to sync.
 */
export const useFreshResults = (
  formattedResultsRef: RefObject<Result[]>,
  handleNewResultsRef: RefObject<(resultSet: ResultSet) => void>,
) => {
  const [freshRawResults, setFreshRawResults] = useState<ResultSet | null>(null);

  const receiveResults = useCallback((data: ResultSet) => {
    console.log('New results:', data);
    if (formattedResultsRef.current.length > 0)
      setFreshRawResults(data);
    else
      handleNewResultsRef.current(data);
  }, [formattedResultsRef, handleNewResultsRef]);

  const handleResultsRefresh = useCallback(() => {
    if (freshRawResults)
      handleNewResultsRef.current(freshRawResults);
    setFreshRawResults(null);
  }, [freshRawResults, handleNewResultsRef]);

  return { freshRawResults, hasFreshResults: freshRawResults !== null, setFreshRawResults, receiveResults, handleResultsRefresh };
};
