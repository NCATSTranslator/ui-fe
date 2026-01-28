import { FC } from 'react';
import { QueryItem } from '@/features/Query/types/querySubmission';
import { Result } from '@/features/ResultList/types/results';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { getEntityLink } from '@/features/Common/utils/utilities';
import styles from '@/features/Query/components/Query/Query.module.scss';
import QueryResultsHeader from '@/features/Query/components/QueryResultsHeader/QueryResultsHeader';
import { ResultContextObject } from '@/features/ResultList/utils/llm';

interface QueryResultsViewProps {
  queryItem: QueryItem;
  nodeDescription: string | null;
  results: Result[];
  loading: boolean;
  pk: string;
  setShareModalFunction: (value: boolean) => void;
  handleResultMatchClick?: (match: ResultContextObject) => void;
}

const QueryResultsView: FC<QueryResultsViewProps> = ({
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
      <QueryResultsHeader
        questionText={resultsPaneQuestionText}
        entityId={queryItem.node?.id}
        entityLabel={queryItem.node?.label}
        onShare={() => setShareModalFunction(true)}
        results={results}
        loading={loading}
        pk={pk}
        className={styles.resultsHeader}
        searchedTermClassName={styles.searchedTerm}
        shareButtonClassName={styles.shareButton}
        onResultMatchClick={handleResultMatchClick}
      />
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
    </>
  );
}; 

export default QueryResultsView;