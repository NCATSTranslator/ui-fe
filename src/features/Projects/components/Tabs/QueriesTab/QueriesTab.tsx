import QueriesTableHeader from '@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader';
import ProjectInnerErrorStates from '@/features/Projects/components/ProjectInnerErrorStates/ProjectInnerErrorStates';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import { UserQueryObject, ProjectListState, DataCardLocation } from '@/features/Projects/types/projects.d';

interface QueriesTabProps {
  location?: DataCardLocation;
  sortedActiveQueries: UserQueryObject[];
  projectListState: ProjectListState;
  queriesError: Error | null;
  queriesLoading: boolean;
  onEditQuery: (query: UserQueryObject) => void;
  onDeleteQuery: (query: UserQueryObject) => void;
  onShareQuery: (query: UserQueryObject) => void;
  styles: Record<string, string>;
}

const QueriesTab = ({
  location = 'list',
  sortedActiveQueries,
  projectListState,
  queriesError,
  queriesLoading,
  onEditQuery,
  onDeleteQuery,
  onShareQuery,
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
        location={location}
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
                  location={location}
                  query={query}
                  queries={sortedActiveQueries}
                  searchTerm={searchTerm}
                  setSelectedQueries={setSelectedQueries}
                  selectedQueries={selectedQueries}
                  onEdit={onEditQuery}
                  onDelete={onDeleteQuery}
                  onShare={onShareQuery}
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
