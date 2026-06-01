import { FC, useMemo } from 'react';
import styles from './ResultListSubheading.module.scss';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { generateEntityLink, getEntityLink } from '@/features/Common/utils/utilities';
import { useUserQueries } from '@/features/Projects/hooks/customHooks';
import { useDynamicPageTitle } from '@/features/Page/hooks/usePageTitle';
import { generateQueryTitleFromQueryObject } from '@/features/Projects/utils/queryTitleUtils';
import ResultListTopBar from '@/features/ResultList/components/ResultListTopBar/ResultListTopBar';

const ResultListSubheading: FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const {
    queryType,
    queryNodeID,
    queryNodeLabel,
    queryNodeDescription,
    isPathfinder,
    pathfinderIdOne,
    pathfinderLabelOne,
    pathfinderIdTwo,
    pathfinderLabelTwo,
    constraintText,
    pk,
  } = useResultListContext();

  const { data: queries = [] } = useUserQueries();
  const query = useMemo(() => queries.find(q => q.data.qid === pk), [queries, pk]);

  const queryTitle = query ? generateQueryTitleFromQueryObject(query) : '';
  useDynamicPageTitle(queryTitle);

  const subHeading = useMemo(() => {
    if (isPathfinder) {
      const linkOne = generateEntityLink(pathfinderIdOne || '', styles.searchedTerm, () => pathfinderLabelOne || '', true);
      const linkTwo = generateEntityLink(pathfinderIdTwo || '', styles.searchedTerm, () => pathfinderLabelTwo || '', true);
      if (constraintText) {
        return <>What paths begin with {linkOne} and end with {linkTwo} and include a {constraintText}?</>;
      }
      return <>What paths begin with {linkOne} and end with {linkTwo}?</>;
    }
    const questionText = (queryType?.label || '')
      .replaceAll("a disease?", "")
      .replaceAll("a chemical?", "")
      .replaceAll("a gene?", "");
    const entityLink = queryNodeID && queryNodeLabel
      ? generateEntityLink(queryNodeID, styles.searchedTerm, () => queryNodeLabel, false)
      : null;
    return <>{questionText}{entityLink}?</>;
  }, [isPathfinder, pathfinderIdOne, pathfinderLabelOne, pathfinderIdTwo, pathfinderLabelTwo, constraintText, queryType, queryNodeID, queryNodeLabel]);

  return (
    <div className={styles.resultListSubheading}>
      <ResultListTopBar/>
      {
        !isLoading &&
        <>
          <h5 className={styles.subHeading}>{subHeading}</h5>
          {queryNodeDescription && (
            <Tooltip id="query-node-description-tooltip" place="bottom">
              <span>{queryNodeDescription}</span>
              {queryNodeID && queryType && (
                <span className={styles.nodeLink}>
                  {getEntityLink(queryNodeID, styles.nodeLinkAnchor, queryType)}
                  <ExternalLink/>
                </span>
              )}
            </Tooltip>
          )}
        </>
      }
    </div>
  );
};

export default ResultListSubheading;
