import { FC } from 'react';
import { QueryItem } from '@/features/Query/types/querySubmission';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { getEntityLink } from '@/features/Common/utils/utilities';
import styles from '@/features/Query/components/Query/Query.module.scss';
import QueryResultsHeader from '@/features/Query/components/QueryResultsHeader/QueryResultsHeader';

interface QueryResultsViewProps {
  queryItem: QueryItem;
  nodeDescription: string | null;
  pk: string;
  setShareModalFunction: (value: boolean) => void;
}

const QueryResultsView: FC<QueryResultsViewProps> = ({
  queryItem,
  nodeDescription,
  pk,
  setShareModalFunction
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
        pk={pk}
        className={styles.resultsHeader}
        searchedTermClassName={styles.searchedTerm}
        shareButtonClassName={styles.shareButton}
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