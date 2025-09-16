import styles from "./QueriesPanel.module.scss";
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import QueryHistoryList from "@/features/History/components/QueryHistoryList/QueryHistoryList";


const QueriesPanel = () => {
  const user = useSelector(currentUser);

  return (
    <div>
      <div className={styles.top}>
        <TextInput iconLeft={<SearchIcon />} handleChange={() => {}} placeholder="Search Queries" />
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
            <QueryHistoryList loading={false} />
          )
        }
      </div>
    </div>
  );
};

export default QueriesPanel;