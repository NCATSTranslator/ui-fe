import { FC } from 'react';
import Button from '@/features/Common/components/Button/Button';
import ResultsSummaryButton from '@/features/ResultList/components/ResultsSummaryButton/ResultsSummaryButton';
import { Result } from '@/features/ResultList/types/results';
import { generateEntityLink } from '@/features/Common/utils/utilities';
import ShareIcon from '@/assets/icons/buttons/Link.svg?react';
import styles from './QueryResultsHeader.module.scss';

const generatePathfinderQuestionText = (labelOne: string, labelTwo: string, constraintText?: string) => {
  if(!!constraintText) {
    return `What paths begin with ${labelOne} and end with ${labelTwo} and include a ${constraintText}?`;
  } else {
    return `What paths begin with ${labelOne} and end with ${labelTwo}?`;
  }
}

const generatePathfinderSubheading = (idOne: string, labelOne: string, idTwo: string, labelTwo: string, constraintText?: string, searchedTermClassName?: string) => {
  const linkOne = generateEntityLink(idOne, `${styles.searchedTerm} ${searchedTermClassName || ""}`, () => labelOne, true);
  const linkTwo = generateEntityLink(idTwo, `${styles.searchedTerm} ${searchedTermClassName || ""}`, () => labelTwo, true);
  if(!!constraintText) {
    return (
      <>
        What paths begin with {linkOne} and end with {linkTwo} and include a {constraintText}?
      </>
    )
  } else {
    return (
      <>
        What paths begin with {linkOne} and end with {linkTwo}?
      </>
    )
  }
}

const generateSmartQuerySubheading = (questionText: string, entityId: string, entityLabel: string, searchedTermClassName?: string) => {
  return (
    <>
      {questionText}
      {entityId && entityLabel && (
        generateEntityLink(entityId, `${styles.searchedTerm} ${searchedTermClassName || ""}`, () => entityLabel, true)
      )}
      ?
    </>
  )
}

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
  isPathfinder?: boolean;
  constraintText?: string;
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
  shareButtonClassName = '',
  isPathfinder = false,
  constraintText
}) => {
  const subHeading = isPathfinder 
  ? generatePathfinderSubheading(
      entityId || '', 
      entityLabel || '', 
      entityIdTwo || '', 
      entityLabelTwo || '', 
      constraintText, 
      searchedTermClassName
    )
  : generateSmartQuerySubheading(questionText, entityId || '', entityLabel || '', searchedTermClassName);
  return(
    <div className={`${styles.resultsHeader} ${className}`}>
      <div className={styles.showingResultsContainer}>
        <h2 className={styles.subHeading}>
          {subHeading}
        </h2>
        <div className={styles.buttons}>
          <Button 
            isSecondary
            handleClick={onShare}
            className={`${styles.shareButton} ${shareButtonClassName}`}
            smallFont
          >
            <ShareIcon/>Share Result Set
          </Button>
          {!loading && results && onResultMatchClick && pk && (
            <ResultsSummaryButton
              results={results}
              queryString={isPathfinder ? generatePathfinderQuestionText(entityLabel!, entityLabelTwo!, constraintText) : questionText}
              handleResultMatchClick={onResultMatchClick}
              pk={pk}
            />
          )}
        </div>
      </div>
    </div>
  )
}; 

export default QueryResultsHeader;