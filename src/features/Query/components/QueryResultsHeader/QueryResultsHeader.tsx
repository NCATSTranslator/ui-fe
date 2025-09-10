import { FC, useMemo, useState } from 'react';
import Button from '@/features/Core/components/Button/Button';
import ResultsSummaryButton from '@/features/ResultList/components/ResultsSummaryButton/ResultsSummaryButton';
import { Result } from '@/features/ResultList/types/results';
import { generateEntityLink } from '@/features/Common/utils/utilities';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import styles from './QueryResultsHeader.module.scss';
import { ResultContextObject } from '@/features/ResultList/utils/llm';
import { generatePathfinderQuestionText } from '@/features/Query/utils/queryTypes';
import { useUser } from '@/features/UserAuth/utils/userApi';
import EditQueryModal from '@/features/Projects/components/EditQueryModal/EditQueryModal';
import { useUserProjects, useUserQueries } from '@/features/Projects/hooks/customHooks';
import { QueryEditingItem } from '@/features/Projects/types/projects';
import { useSelector } from 'react-redux';
import { currentConfig } from '@/features/UserAuth/slices/userSlice';

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
  onResultMatchClick?: (match: ResultContextObject) => void;
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
  const config = useSelector(currentConfig);
  const [user, userLoading] = useUser();
  const [isEditQueryModalOpen, setIsEditQueryModalOpen] = useState<boolean>(false);
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useUserProjects();
  const { data: queries = [], isLoading: queriesLoading, error: queriesError } = useUserQueries();
  const query = useMemo(() => queries.find(q => q.data.qid === pk), [queries, pk]);
  const currentEditingQueryItem: QueryEditingItem = useMemo(() => query && pk ? {
    pk: query.data.qid,
    name: query.data.title || "",
    queryIds: [pk],
    status: "editing",
    type: "query",
  } : undefined, [query, pk]);

  const handleAddToProject = () => {
    setIsEditQueryModalOpen(true);
  };
  
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
  const showAddToProjectButton = 
    !!user &&
    !userLoading &&
    !projectsLoading &&
    !projectsError &&
    !queriesLoading &&
    !queriesError &&
    config?.include_projects;

  return(
    <div className={`${styles.resultsHeader} ${className}`}>
      <EditQueryModal
        isOpen={isEditQueryModalOpen}
        handleClose={() => setIsEditQueryModalOpen(false)}
        loading={projectsLoading}
        mode="edit"
        projects={projects}
        queries={queries}
        currentEditingQueryItem={currentEditingQueryItem}
      />
      <div className={styles.showingResultsContainer}>
        <h2 className={styles.subHeading}>
          {subHeading}
        </h2>
        <div className={styles.buttons}>
          {
            showAddToProjectButton && (
              <Button 
                variant="secondary"
                handleClick={handleAddToProject}
                className={`${styles.addButton}`}
                small
                iconLeft={<FolderIcon/>}
              >
              Add to Project
            </Button>
            )
          }
          <Button 
            variant="secondary"
            handleClick={onShare}
            className={`${styles.shareButton} ${shareButtonClassName}`}
            small
            iconLeft={<ShareIcon/>}
          >
            Share Result Set
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