import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import styles from "./QueryList.module.scss";
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import { useSortSearchState, useUserQueries } from "@/features/Projects/hooks/customHooks";
import QueriesTableHeader from "@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader";
import QueryCard from "@/features/Projects/components/QueryCard/QueryCard";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import { useSimpleSearch } from "@/features/Common/hooks/simpleSearchHook";
import { useFilteredQueries, useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import ListHeader from "@/features/Core/components/ListHeader/ListHeader";
import Tabs from "@/features/Common/components/Tabs/Tabs";
import Tab from "@/features/Common/components/Tabs/Tab";
import CardList from "@/features/Projects/components/CardList/CardList";
import Button from "@/features/Core/components/Button/Button";
import SearchPlusIcon from '@/assets/icons/projects/searchplus.svg?react';
import ChevDownIcon from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import { useAnimateHeight } from "@/features/Core/hooks/useAnimateHeight";
import AnimateHeight from "react-animate-height";
import CombinedQueryInterface from "@/features/Query/components/CombinedQueryInterface/CombinedQueryInterface";
import EmptyArea from "@/features/Projects/components/EmptyArea/EmptyArea";
import { joinClasses } from "@/features/Common/utils/utilities";
import { getFormattedLoginURL } from "@/features/UserAuth/utils/userApi";
import DropLabel from "@/features/Projects/components/DropLabel/DropLabel";

const QueryList = () => {
  const location = useLocation();
  const user = useSelector(currentUser);
  const { data: queries = [], isLoading: queriesLoading, refetch: refetchQueries } = useUserQueries();
  const { searchTerm, handleSearch } = useSimpleSearch();
  const sortSearchState = useSortSearchState();
  const filteredQueries = useFilteredQueries(queries, false, sortSearchState, searchTerm);
  const { activePanelId } = useSidebar();
  const { height, toggle: handleAddNewQueryClick } = useAnimateHeight();

  const handleRefetch = () => {
    refetchQueries();
  }
  
  const queriesTabHeading = useMemo(() => {
    return `${filteredQueries.length} Quer${filteredQueries.length === 1 ? 'y' : 'ies'}`;
  }, [filteredQueries]);

  const showDropLabel = useMemo(() => {
    return activePanelId === 'projects';
  }, [activePanelId]);

  return (
    <div className={styles.queriesPanel}>
      <ListHeader
        heading="Queries"
        searchPlaceholder="Search Queries"
        searchTerm={searchTerm}
        handleSearch={handleSearch}
      />
      <div className={styles.list}>
        <Button 
          iconLeft={<SearchPlusIcon />}
          iconRight={<ChevDownIcon className={styles.iconRight} />}
          handleClick={handleAddNewQueryClick}
          title="Add New Query"
          className={joinClasses(styles.addNewQueryButton, (!user || queriesLoading) && styles.disabled)}
          variant="textOnly"
          disabled={!user || queriesLoading}
        >
          Add New Query
        </Button>
        {
          !user ? (
            <EmptyArea>
              <p>
                <a href={getFormattedLoginURL(location)} className={styles.link}>Log in</a> to view your saved queries.
              </p>
            </EmptyArea>
          ) : (
            <LoadingWrapper loading={queriesLoading} contentClassName={styles.queriesList}>
              <Tabs
                isOpen={true}
                handleTabSelection={() => {}}
                defaultActiveTab={queriesTabHeading}
                className={styles.queryTabs}
                activeTab={queriesTabHeading}
                controlled
              >
                {[
                  <Tab key="queries" heading={queriesTabHeading} className={styles.queryTabContent}>
                    <AnimateHeight
                      duration={500}
                      height={height}
                      className={styles.combinedQueryInterfaceContainer}
                    >
                      <CombinedQueryInterface
                        projectPage
                        submissionCallback={handleRefetch}
                      />
                    </AnimateHeight>
                    <CardList>
                      <DropLabel
                        show={showDropLabel}
                        label="Drag to drop queries into projects."
                      />
                      <QueriesTableHeader
                        sortField={sortSearchState.sortField}
                        sortDirection={sortSearchState.sortDirection}
                        onSort={sortSearchState.handleSort}
                      />
                      {
                        (searchTerm.length === 0 && filteredQueries.length === 0)
                        ? (
                          <EmptyArea heading="No Queries">
                            {
                              <p>Your bookmarks and notes are saved here when you run a <Button handleClick={handleAddNewQueryClick} title="New Query" variant="textOnly" inline>New Query</Button>.</p>
                            }
                          </EmptyArea>
                          ) 
                        : 
                          (
                            filteredQueries.length === 0 ? (
                              <EmptyArea>
                                <p>No queries found matching your search.</p>
                              </EmptyArea>
                            ) : (
                              <>
                                {
                                  filteredQueries.map((query) => {
                                    return (
                                      <QueryCard key={query.data.qid} query={query} searchTerm={searchTerm} />
                                    )
                                  })
                                }
                              </>
                            )
                          )
                      }
                    </CardList>
                  </Tab>
                ]}
              </Tabs>
            </LoadingWrapper>
          )
        }
      </div>
    </div>
  );
};

export default QueryList;