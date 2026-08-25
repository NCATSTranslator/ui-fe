import { FC } from 'react';
import styles from './ProjectDetailInner.module.scss';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import LoadingWrapper from '@/features/Core/components/LoadingWrapper/LoadingWrapper';
import ProjectDetailErrorStates from '@/features/Projects/components/ProjectDetailErrorStates/ProjectDetailErrorStates';
import { DroppableArea } from '@/features/DragAndDrop/components/DroppableArea/DroppableArea';
import type { DraggableData } from '@/features/DragAndDrop/types/types';
import Button from '@/features/Core/components/Button/Button';
import QueriesTableHeader from '../TableHeader/QueriesTableHeader/QueriesTableHeader';
import CardList from '@/features/Core/components/CardList/CardList';
import EmptyArea from '@/features/Projects/components/EmptyArea/EmptyArea';
import DropLabel from '@/features/Projects/components/DropLabel/DropLabel';
import type { UserQueryObject, SortField, SortDirection } from '@/features/Projects/types/projects';

interface ProjectDetailQueriesPanelProps {
  isDraggedQueryInProject: boolean;
  onQueryDrop: (draggedItem: DraggableData) => void;
  projectId?: number;
  queriesLoading: boolean;
  searchTerm: string;
  shouldShowQueriesErrorState: boolean;
  showDropLabel: boolean;
  sortDirection: SortDirection;
  sortField: SortField;
  sortedQueries: UserQueryObject[];
  onSort: (field: SortField) => void;
  onToggleQueriesPanel: () => void;
  onAddNewQuery: () => void;
}

const ProjectDetailQueriesPanel: FC<ProjectDetailQueriesPanelProps> = ({
  isDraggedQueryInProject,
  onQueryDrop,
  projectId,
  queriesLoading,
  searchTerm,
  shouldShowQueriesErrorState,
  showDropLabel,
  sortDirection,
  sortField,
  sortedQueries,
  onSort,
  onToggleQueriesPanel,
  onAddNewQuery,
}) => {
  const emptyContent = searchTerm ? (
    <EmptyArea heading="">
      <p>No matches found.</p>
    </EmptyArea>
  ) : (
    <EmptyArea heading="No Queries">
      <p>
        You can add queries to this project from the{' '}
        <Button handleClick={onToggleQueriesPanel} title="Queries" variant="textOnly" inline>Queries</Button>
        {' '}tab or run a{' '}
        <Button handleClick={onAddNewQuery} title="New Query" variant="textOnly" inline>New Query</Button>.
      </p>
    </EmptyArea>
  );

  let listBody;
  if (shouldShowQueriesErrorState) {
    listBody = <ProjectDetailErrorStates type="queries" styles={styles} />;
  } else if (sortedQueries.length === 0) {
    listBody = emptyContent;
  } else {
    listBody = sortedQueries.map((query) => (
      <QueryCard
        key={query.data.qid}
        query={query}
        searchTerm={searchTerm}
        projectId={projectId}
      />
    ));
  }

  return (
    <DroppableArea
      id="project-zone"
      canAccept={(draggedData) => draggedData.type === 'query'}
      data={{
        id: projectId?.toString(),
        type: 'project',
        onDrop: onQueryDrop,
      }}
      indicatorText={`${isDraggedQueryInProject ? 'Already in Project' : 'Add to Project'}`}
      indicatorStatus={isDraggedQueryInProject ? 'error' : 'default'}
      className={styles.droppableArea}
    >
      <DropLabel
        show={showDropLabel}
        label="Drag to drop queries into projects."
      />
      <LoadingWrapper loading={queriesLoading}>
        <CardList className={styles.cardList}>
          {sortedQueries.length > 0 && (
            <QueriesTableHeader
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          )}
          {listBody}
        </CardList>
      </LoadingWrapper>
    </DroppableArea>
  );
};

export default ProjectDetailQueriesPanel;
