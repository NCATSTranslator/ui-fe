import { FC, useState, lazy, Suspense } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import { LastViewedPathIDContext } from '@/features/ResultItem/hooks/resultHooks';
import LoadingWrapper from '@/features/Core/components/LoadingWrapper/LoadingWrapper';
import useScrollPreservation from '@/features/Navigation/hooks/useScrollPreservation';

const ResultDetailView = lazy(() => import('@/features/ResultItem/components/ResultDetailView/ResultDetailView'));

const ResultDetailLayout: FC = () => {
  const [lastViewedPathID, setLastViewedPathID] = useState<string | null>(null);
  const isBaseView = useMatch('/results/:resultId') !== null;
  useScrollPreservation(isBaseView);

  return (
    <LastViewedPathIDContext.Provider value={{ lastViewedPathID, setLastViewedPathID }}>
      <div style={isBaseView ? undefined : { display: 'none' }}>
        <Suspense fallback={<LoadingWrapper />}>
          <ResultDetailView />
        </Suspense>
      </div>
      {!isBaseView && <Outlet />}
    </LastViewedPathIDContext.Provider>
  );
};

export default ResultDetailLayout;
