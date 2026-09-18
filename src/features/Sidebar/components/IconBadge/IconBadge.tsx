import { FC, ReactNode } from "react";
import styles from "./IconBadge.module.scss";

interface IconBadgeProps {
  children: ReactNode;
  count: number;
}

const IconBadge: FC<IconBadgeProps> = ({ children, count }) => {
  return (
    <span className={styles.iconBadge}>
      {children}
      {count > 0 && <span className={styles.badge}>{count}</span>}
    </span>
  );
};

export default IconBadge;
