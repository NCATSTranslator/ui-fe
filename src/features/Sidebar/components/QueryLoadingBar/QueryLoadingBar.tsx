import { FC } from "react";
import styles from "./QueryLoadingBar.module.scss";

interface QueryLoadingBarProps {
  fillPercentage: number;
  full?: boolean;
}

const QueryLoadingBar: FC<QueryLoadingBarProps> = ({ fillPercentage, full = false }) => {
  return (
    <div className={styles.loadingBarContainer}>
      <div 
        className={`${styles.loadingBarFill} ${full && styles.full}`}
        style={{ width: `${Math.min(Math.max(fillPercentage, 0), 100)}%` }}
      />
    </div>
  );
};

export default QueryLoadingBar;
