import { useRef, useEffect } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import Breadcrumbs from '@/features/Navigation/components/Breadcrumbs/Breadcrumbs';
import ViewTransition from '@/features/Navigation/components/ViewTransition/ViewTransition';
import ResultList from '@/features/ResultList/components/ResultList/ResultList';
import { MAIN_CONTENT_ELEMENT_ID } from '@/features/Navigation/utils/navigationUtils';

const ResultsLayout = () => {
  const isBaseView = useMatch('/results') !== null;
  const resultMatch = useMatch('/results/:resultId/*');
  const scrollRef = useRef(0);

  useEffect(() => {
    const mainEl = document.getElementById(MAIN_CONTENT_ELEMENT_ID);
    if (!mainEl) return;

    if (!isBaseView) {
      scrollRef.current = mainEl.scrollTop;
      mainEl.scrollTo({ top: 0 });
    } else {
      requestAnimationFrame(() => mainEl.scrollTo({ top: scrollRef.current }));
    }
  }, [isBaseView]);

  return (
    <>
      <Breadcrumbs />
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
