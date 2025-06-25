import { FC } from 'react';
import Button from '@/features/Common/components/Button/Button';
import ResultsSummaryButton from '@/features/ResultList/components/ResultsSummaryButton/ResultsSummaryButton';
import { Result } from '@/features/ResultList/types/results';
import { generateEntityLink } from '@/features/Common/utils/utilities';
import ShareIcon from '@/assets/icons/Buttons/Link.svg?react';
import styles from './QueryResultsHeader.module.scss';

interface QueryResultsHeaderProps {
  questionText: string;
  entityId?: string;
  entityIdTwo?: string;
  entityLabel?: string;
  entityLabelTwo?: string;
  onShare: () => void;
  results?: Result[];
  loading?: boolean;
  onResultMatchClick?: Function;
  pk?: string;
  className?: string;
  searchedTermClassName?: string;
  shareButtonClassName?: string;
}

const QueryResultsHeader: FC<QueryResultsHeaderProps> = ({
  questionText,
  entityId,
  entityIdTwo,
  entityLabel,
  entityLabelTwo,
  onShare,
  results,
  loading,
  onResultMatchClick,
  pk,
  className = '',
  searchedTermClassName = '',
  shareButtonClassName = ''
}) => (
  <div className={`${styles.resultsHeader} ${className}`}>
    <div className={styles.showingResultsContainer}>
      <h6 className={styles.subHeading}>
        {questionText}
        {entityId && entityLabel && (
          generateEntityLink(entityId, `${styles.searchedTerm} ${searchedTermClassName}`, () => entityLabel, true)
        )}
        {entityIdTwo && entityLabelTwo && (
          generateEntityLink(entityIdTwo, `${styles.searchedTerm} ${searchedTermClassName}`, () => entityLabelTwo, true)
        )}
      </h6>
      <Button 
        isSecondary
        handleClick={onShare}
        className={`${styles.shareButton} ${shareButtonClassName}`}
      >
        <ShareIcon/>Share Result Set
      </Button>
      {!loading && results && onResultMatchClick && pk && (
        <ResultsSummaryButton
          results={results}
          queryString={questionText}
          handleResultMatchClick={onResultMatchClick}
          pk={pk}
        />
      )}
    </div>
  </div>
); 

export default QueryResultsHeader;