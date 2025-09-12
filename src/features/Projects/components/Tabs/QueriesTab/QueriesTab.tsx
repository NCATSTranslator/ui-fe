import QueriesTableHeader from '@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader';
import ProjectInnerErrorStates from '@/features/Projects/components/ProjectInnerErrorStates/ProjectInnerErrorStates';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import { UserQueryObject, ProjectListState, DataCardLocation } from '@/features/Projects/types/projects.d';
import { currentUser } from '@/features/UserAuth/slices/userSlice';
import { useSelector } from 'react-redux';

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
  const user = useSelector(currentUser);
  const hasUser = !!user;
  const noQueriesFound = sortedActiveQueries.length === 0;
  const noQueriesFoundWithSearch = noQueriesFound && searchTerm.length > 0;
  return (
    <>
      {
        !noQueriesFound && (
        <QueriesTableHeader 
          activeQueries={sortedActiveQueries}
          onSort={handleSort}
          selectedQueries={selectedQueries}
          setSelectedQueries={setSelectedQueries}
          sortField={sortField}
          sortDirection={sortDirection}
          location={location}
        />
      )}
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
            {noQueriesFound ? (
              <div className={styles.emptyState}>
                {noQueriesFoundWithSearch ? (
                  <p>No queries found matching your search.</p>
                ) : (
                  hasUser ? (
                    <>
                    <h6>No Queries</h6>
                    <p>
                      Anytime you run a <a href="/" target="_blank" className={styles.link}>New Query</a>, it will be saved here.
                    </p>
                  </>
                  ) : (
                    <>
                      <h6>No Queries</h6>
                      <p>
                        <a href="/login" className={styles.link}>Log in</a> to view your saved queries.
                      </p>
                    </>
                  )
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
