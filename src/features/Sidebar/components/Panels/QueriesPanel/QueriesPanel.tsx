import styles from "./QueriesPanel.module.scss";
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import { useUserQueries } from "@/features/Projects/hooks/customHooks";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import SidebarQueryCard from "@/features/Sidebar/components/SidebarQueryCard/SidebarQueryCard";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import { useSimpleSearch } from "@/features/Common/hooks/simpleSearchHook";
import { useFilteredQueries } from "@/features/Sidebar/hooks/sidebarHooks";

const QueriesPanel = () => {
  const user = useSelector(currentUser);
  const { data: queries = [], isLoading: queriesLoading } = useUserQueries();
  const { searchTerm, handleSearch } = useSimpleSearch();
  const filteredQueries = useFilteredQueries(queries, searchTerm);

  return (
    <div className={styles.queriesPanel}>
      <div className={styles.top}>
        <TextInput iconLeft={<SearchIcon />} handleChange={handleSearch} placeholder="Search Queries" />
      </div>
      <div className={styles.list}>
        {
          !user ? (
            <div className={styles.empty}>
              <p>
                <a href="/login" className={styles.link}>Log in</a> to view your saved queries.
              </p>
            </div>
          ) : (
            <LoadingWrapper loading={queriesLoading} contentClassName={styles.queriesList}>
              {filteredQueries.map((query) => {
                return (
                  <SidebarQueryCard key={query.data.qid} query={query} searchTerm={searchTerm} />
                )
              })}
            </LoadingWrapper>
          )
        }
      </div>
    </div>
  );
};

export default QueriesPanel;