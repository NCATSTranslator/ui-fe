import { FC, ReactNode } from "react";
import styles from "./EmptyArea.module.scss";

interface EmptyAreaProps {
  children: ReactNode;
  heading?: string;
}

const EmptyArea: FC<EmptyAreaProps> = ({
  children,
  heading
}) => {
  return(
    <div className={styles.emptyArea}>
      {heading && (
        <h6 className={styles.heading}>{heading}</h6>
      )}
      {
        children && (
          <div className={styles.content}>
            {
              children
            }
          </div>
        )
      }
    </div>
  )
}
export default EmptyArea;