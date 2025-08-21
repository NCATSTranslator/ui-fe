import QueriesTableHeader from '@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader';
import ProjectInnerErrorStates from '@/features/Projects/components/ProjectInnerErrorStates/ProjectInnerErrorStates';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import { UserQueryObject, ProjectListState } from '@/features/Projects/types/projects.d';

interface QueriesTabProps {
  sortedActiveQueries: UserQueryObject[];
  projectListState: ProjectListState;
  queriesError: Error | null;
  queriesLoading: boolean;
  onEditQuery: (query: UserQueryObject) => void;
  onDeleteQuery: (query: UserQueryObject) => void;
  styles: Record<string, string>;
}

const QueriesTab = ({
  sortedActiveQueries,
  projectListState,
  queriesError,
  queriesLoading,
  onEditQuery,
  onDeleteQuery,
  styles
}: QueriesTabProps) => {
  const { 
    selectedQueries, 
    setSelectedQueries, 
    sortField, 
    sortDirection, 
    handleSort, 
    searchTerm 
  } = projectListState;
  return (
    <>
      <QueriesTableHeader 
        activeQueries={sortedActiveQueries}
        onSort={handleSort}
        selectedQueries={selectedQueries}
        setSelectedQueries={setSelectedQueries}
        sortField={sortField}
        sortDirection={sortDirection}
      />
      {queriesError ? (
        <ProjectInnerErrorStates
          type="queries"
          styles={styles}
        />
      ) : (
        <LoadingWrapper
          loading={queriesLoading}
          wrapperClassName={styles.loadingWrapper}
          spinnerClassName={styles.loadingSpinner}
        >
          <div className={styles.projectGrid}>
            {sortedActiveQueries.length === 0 ? (
              <div className={styles.emptyState}>
                {searchTerm.length > 0 ? (
                  <p>No queries found matching your search.</p>
                ) : (
                  <>
                    <h6>No Queries</h6>
                    <p>
                      Your bookmarks and notes are saved here when you run a <a href="/" target="_blank" className={styles.link}>New Query</a>.
                    </p>
                  </>
                )}
              </div>
            ) : (
              sortedActiveQueries.map((query: UserQueryObject) => (
                <QueryCard 
                  key={query.data.qid}
                  query={query}
                  searchTerm={searchTerm}
                  setSelectedQueries={setSelectedQueries}
                  selectedQueries={selectedQueries}
                  onEdit={onEditQuery}
                  onDelete={onDeleteQuery}
                />
              ))
            )}
          </div>
        </LoadingWrapper>
      )}
    </>
  );
};

export default QueriesTab;
