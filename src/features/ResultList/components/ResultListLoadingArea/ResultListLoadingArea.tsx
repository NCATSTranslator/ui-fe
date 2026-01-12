import styles from './ResultListLoadingArea.module.scss';
import LoadingBar from "@/features/Common/components/LoadingBar/LoadingBar"
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import { Link } from 'react-router-dom';

const ResultListLoadingArea = () => {
  const user = useSelector(currentUser);

  const NonLoggedInDisclaimerText = () => {
    return (
      <>
        <p className={styles.loadingText}>Translator results are loaded incrementally due to the complexity of our reasoning systems. As more results become available, you'll be prompted to refresh the page to view them. <span className="bold">Please note that refreshing the page may reorder the results.</span></p>
        <p className={styles.loadingText}>While you wait for results to load, you can <Link to="/new-query">run another query</Link> or <Link to="/login">log in</Link> to explore the results, bookmarks, and notes from your past queries in your Projects or Query History.</p>
      </>
    )
  }
  const LoggedInDisclaimerText = () => {
    return (
      <>
        <p className={styles.loadingText}>Translator results are loaded incrementally due to the complexity of our reasoning systems. As more results become available, you'll be prompted to refresh the page to view them. <span className="bold">Please note that refreshing the page may reorder the results.</span></p>
        <p className={styles.loadingText}>While you wait for results to load, you can <Link to="/new-query">run another query</Link> or explore the results, bookmarks, and notes from your past queries in your <Link to="/projects">Projects</Link> or <Link to="/queries">Query History</Link>.</p>
      </>
    )
  }
  
  return (
    <LoadingBar
      useIcon
      disclaimerText={!!user ? <LoggedInDisclaimerText /> : <NonLoggedInDisclaimerText />}
    />
  )
}

export default ResultListLoadingArea;