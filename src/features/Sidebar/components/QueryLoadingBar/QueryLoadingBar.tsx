import { FC } from "react";
import styles from "./QueryLoadingBar.module.scss";

interface QueryLoadingBarProps {
  fillPercentage: number;
  full?: boolean;
  hide?: boolean;
}

const QueryLoadingBar: FC<QueryLoadingBarProps> = ({ fillPercentage, full = false, hide = false }) => {
  return (
    <div className={`${styles.loadingBarContainer} ${hide ? styles.hide : ''}`}>
      <div 
        className={`${styles.loadingBarFill} ${full ? styles.full : ''}`}
        style={{ width: `${Math.min(Math.max(fillPercentage, 0), 100)}%` }}
      />
    </div>
  );
};

export default QueryLoadingBar;
