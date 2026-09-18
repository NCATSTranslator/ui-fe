import { useState } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import ViewTransition from '@/features/Navigation/components/ViewTransition/ViewTransition';
import ResultList from '@/features/ResultList/components/ResultList/ResultList';
import useScrollPreservation from '@/features/Navigation/hooks/useScrollPreservation';
import { LastViewedPathIDContext } from '@/features/ResultItem/hooks/resultHooks';

const ResultsLayout = () => {
  const [lastViewedPathID, setLastViewedPathID] = useState<string | null>(null);
  const isBaseView = useMatch('/results') !== null;
  const resultMatch = useMatch('/results/:resultId/*');
  useScrollPreservation(isBaseView);

  return (
    <>
      <LastViewedPathIDContext.Provider value={{ lastViewedPathID, setLastViewedPathID }}>
        <ResultList hidden={!isBaseView}>
          {!isBaseView && (
            <ViewTransition transitionKey={resultMatch?.params.resultId}>
              <Outlet />
            </ViewTransition>
          )}
        </ResultList>
      </LastViewedPathIDContext.Provider>
    </>
  );
};

export default ResultsLayout;
