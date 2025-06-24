import { FC } from 'react';
import { QueryItem } from '@/Types/querySubmission';
import { Result } from '@/Types/results';
import EntityLink from '@/Components/EntityLink/EntityLink';
import Tooltip from '@/Components/Tooltip/Tooltip';
import Button from '@/Components/Core/Button';
import ResultsSummaryButton from '@/Components/ResultsSummaryButton/ResultsSummaryButton';
import ShareIcon from '@/Icons/Buttons/Link.svg?react';
import ExternalLink from '@/Icons/Buttons/External Link.svg?react';
import { getEntityLink } from '@/Utilities/utilities';
import styles from '@/Components/Query/Query.module.scss';

interface QueryResultsViewProps {
  queryItem: QueryItem;
  nodeDescription: string | null;
  results: Result[];
  loading: boolean;
  pk: string;
  setShareModalFunction: (value: boolean) => void;
  handleResultMatchClick: Function;
}

export const QueryResultsView: FC<QueryResultsViewProps> = ({
  queryItem,
  nodeDescription,
  results,
  loading,
  pk,
  setShareModalFunction,
  handleResultMatchClick
}) => {
  const resultsPaneQuestionText = queryItem.type.label
    .replaceAll("a disease?", "")
    .replaceAll("a chemical?", "")
    .replaceAll("a gene?", "");

  return (
    <>
      <div className={styles.resultsHeader}>
        <div className={styles.showingResultsContainer}>
          <h6 className={styles.subHeading}>
            {resultsPaneQuestionText}
            <span className={styles.entityLinkContainer}>
              <EntityLink
                id={queryItem.node?.id || ""}
                className={styles.searchedTerm}
                linkTextGenerator={() => queryItem.node?.label || ""}
                useIcon
                fallbackText={queryItem.node?.label}
                data-tooltip-id="query-node-description-tooltip"
              />
              ?
            </span>
          </h6>
          {nodeDescription && (
            <Tooltip id="query-node-description-tooltip" place="bottom">
              <span>{nodeDescription}</span>
              {queryItem?.node?.id && (
                <span className={styles.nodeLink}>
                  {getEntityLink(
                    queryItem.node.id,
                    styles.nodeLinkAnchor,
                    queryItem.type
                  )}
                  <ExternalLink/>
                </span>
              )}
            </Tooltip>
          )}
        </div>
      </div>
      <div className={styles.bottom}>
        <Button
          isSecondary
          handleClick={() => setShareModalFunction(true)}
          smallFont
        >
          <ShareIcon className={styles.shareIcon} />
          <span>Share Result Set</span>
        </Button>
        {!loading && (
          <ResultsSummaryButton
            results={results}
            queryString={`${resultsPaneQuestionText}${queryItem.node?.label || ""}`}
            handleResultMatchClick={handleResultMatchClick}
            pk={pk}
          />
        )}
      </div>
    </>
  );
}; 