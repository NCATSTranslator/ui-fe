import { Outlet, useMatch } from 'react-router-dom';
import ViewTransition from '@/features/Navigation/components/ViewTransition/ViewTransition';
import ResultList from '@/features/ResultList/components/ResultList/ResultList';
import useScrollPreservation from '@/features/Navigation/hooks/useScrollPreservation';

const ResultsLayout = () => {
  const isBaseView = useMatch('/results') !== null;
  const resultMatch = useMatch('/results/:resultId/*');
  useScrollPreservation(isBaseView);

  return (
    <>
      <ResultList hidden={!isBaseView}>
        {!isBaseView && (
          <ViewTransition transitionKey={resultMatch?.params.resultId}>
            <Outlet />
          </ViewTransition>
        )}
      </ResultList>
    </>
  );
};

export default ResultsLayout;
