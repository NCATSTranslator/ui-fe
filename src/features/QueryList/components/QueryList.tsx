import { useMemo, useState, useEffect } from "react";
import styles from "./QueryList.module.scss";
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import { useSortSearchState, useUserQueries } from "@/features/Projects/hooks/customHooks";
import QueriesTableHeader from "@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader";
import QueryCard from "@/features/Projects/components/QueryCard/QueryCard";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import { useSimpleSearch } from "@/features/Common/hooks/simpleSearchHook";
import { useFilteredQueries } from "@/features/Sidebar/hooks/sidebarHooks";
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

const QueryList = () => {
  const user = useSelector(currentUser);
  const { data: queries = [], isLoading: queriesLoading, refetch: refetchQueries } = useUserQueries();
  const { searchTerm, handleSearch } = useSimpleSearch();
  const filteredQueries = useFilteredQueries(queries, false, searchTerm);
  const sortSearchState = useSortSearchState();

  const { height, toggle: handleAddNewQueryClick } = useAnimateHeight();

  const handleRefetch = () => {
    refetchQueries();
  }
  
  const queriesTabHeading = useMemo(() => {
    return `${filteredQueries.length} Quer${filteredQueries.length === 1 ? 'y' : 'ies'}`;
  }, [filteredQueries]);

  return (
    <div className={styles.queriesPanel}>
      <ListHeader
        heading="Queries"
        searchPlaceholder="Search by Project or Query Name"
        searchTerm={searchTerm}
        handleSearch={handleSearch}
      />
      <div className={styles.list}>
        <Button 
          iconLeft={<SearchPlusIcon />}
          iconRight={<ChevDownIcon className={styles.iconRight} />}
          handleClick={handleAddNewQueryClick}
          title="Add New Query"
          className={styles.addNewQueryButton}
          variant="textOnly"
        >
          Add New Query
        </Button>
        {
          !user ? (
            <div className={styles.empty}>
              <p>
                <a href="/login" className={styles.link}>Log in</a> to view your saved queries.
              </p>
            </div>
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
                      <QueriesTableHeader
                        sortField={sortSearchState.sortField}
                        sortDirection={sortSearchState.sortDirection}
                        onSort={sortSearchState.handleSort}
                      />
                      {
                        queries.length === 0 
                        ? (
                            <div className={styles.empty}>
                              <p>No queries found.</p>
                            </div>
                          ) 
                        : 
                          (
                            filteredQueries.length === 0 ? (
                              <div className={styles.empty}>
                                <p>No queries found matching your search.</p>
                              </div>
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