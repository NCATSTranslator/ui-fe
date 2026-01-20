import { useMemo } from "react";
import styles from "./QueriesPanel.module.scss";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import { useSortSearchState, useUserQueries } from "@/features/Projects/hooks/customHooks";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import SidebarQueryCard from "@/features/Sidebar/components/SidebarQueryCard/SidebarQueryCard";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import { useSimpleSearch } from "@/features/Common/hooks/simpleSearchHook";
import { useFilteredQueries, useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { getFormattedLoginURL } from "@/features/UserAuth/utils/userApi";
import SidebarProjectList from "@/features/Sidebar/components/SidebarProjectList/SidebarProjectList";
import { getDataFromQueryVar } from "@/features/Common/utils/utilities";
import DropLabel from "@/features/Projects/components/DropLabel/DropLabel";
import SidebarBackButton from "@/features/Sidebar/components/SidebarBackButton/SidebarBackButton";
import { joinClasses } from "@/features/Common/utils/utilities";

const QueriesPanel = () => {
  const location = useLocation();
  const user = useSelector(currentUser);
  const { data: queries = [], isLoading: queriesLoading } = useUserQueries();
  const { searchTerm, handleSearch } = useSimpleSearch();
  const sortSearchState = useSortSearchState();
  const filteredQueries = useFilteredQueries(queries, false, sortSearchState, searchTerm);
  const { addToProjectQuery, isSelectedProjectMode, clearAddToProjectMode, setSelectedProjectMode }= useSidebar();
  const activeQueryId = useMemo(() => {
    const currentQid = getDataFromQueryVar('q', window.location.search);
    return filteredQueries.find(query => query.data.qid === currentQid)?.data.qid;
  }, [filteredQueries, window.location.search]);

  const handleCloseProjectList = () => {
    clearAddToProjectMode();
    setSelectedProjectMode(false);
  };
  const showDropLabel = useMemo(() => {
    return location.pathname.includes('project') && filteredQueries.length > 0 && !queriesLoading;
  }, [location.pathname, filteredQueries.length, queriesLoading]);

  return (
    <div className={styles.queriesPanel}>
      <div className={styles.top}>
        <TextInput
          iconLeft={<SearchIcon />}
          iconRight={searchTerm.length > 0 && <CloseIcon />}
          iconRightClickToReset
          handleChange={handleSearch}
          placeholder="Search Queries"
        />
      </div>
      <DropLabel
        show={showDropLabel}
        label="Drag to drop queries into projects."
      />
      <div className={styles.list}>
        {
          !user ? (
            <div className={styles.empty}>
              <p>
                <a href={getFormattedLoginURL(location)} className={styles.link}>Log in</a> to view your saved queries.
              </p>
            </div>
          ) : (
            <LoadingWrapper loading={queriesLoading} contentClassName={styles.queriesList}>
              {
                filteredQueries.length === 0 ? (
                  <div className={styles.empty}>
                    {
                      searchTerm.length === 0 ? (
                        <p>No queries found. <Link to="/new-query">Submit a new query</Link> to add it to your query history.</p>
                      ) : (
                        <p>No queries found matching your search.</p>
                      )
                    }
                  </div>
                ) : (
                  filteredQueries.map((query) => {
                    return (
                      <SidebarQueryCard
                        key={query.data.qid}
                        query={query}
                        searchTerm={searchTerm}
                        isActiveQuery={activeQueryId === query.data.qid}
                      />
                    )
                  })
                )
              }
            </LoadingWrapper>
          )
        }
      </div>
      {
        (addToProjectQuery || isSelectedProjectMode) && (
          <div className={styles.projectListContainer}>
            <SidebarBackButton label="Select Project" handleClick={handleCloseProjectList} />
            <SidebarProjectList className={joinClasses(styles.projectsList, "scrollable")} />
          </div>
        )
      }
    </div>
  );
};

export default QueriesPanel;