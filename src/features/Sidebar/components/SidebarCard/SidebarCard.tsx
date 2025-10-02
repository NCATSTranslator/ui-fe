import { FC, ReactNode, MouseEvent, useCallback } from "react";
import styles from "./SidebarCard.module.scss";
import SidebarCardTitle from "@/features/Sidebar/components/SidebarCardTitle/SidebarCardTitle";
import { joinClasses } from "@/features/Common/utils/utilities";

interface SidebarCardProps {
  leftIcon: ReactNode;
  title: string;
  searchTerm?: string;
  linkTo?: string;
  linkTarget?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  // Bottom content (metadata, counts, etc.)
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

const SidebarCard: FC<SidebarCardProps> = ({
  leftIcon,
  title,
  searchTerm,
  linkTo,
  linkTarget,
  onClick,
  bottomLeft,
  bottomRight,
  className,
  'data-testid': testId
}) => {
  const handleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    // Don't trigger onClick if user clicked on a link
    if (linkTo && event.target !== event.currentTarget) {
      return;
    }
    onClick?.(event);
  }, [onClick, linkTo]);

  const cardClassName = joinClasses(styles.sidebarCard, className);

  return (
    <div 
      className={cardClassName}
      onClick={onClick ? handleClick : undefined}
      data-testid={testId}
    >
      <div className={styles.leftSection}>
        {leftIcon}
      </div>
      <div className={styles.content}>
        <SidebarCardTitle
          title={title}
          searchTerm={searchTerm}
          linkTo={linkTo}
          linkTarget={linkTarget}
        />
        {(bottomLeft || bottomRight) && (
          <div className={styles.bottom}>
            <div className={styles.bottomLeft}>
              {bottomLeft}
            </div>
            <div className={styles.bottomRight}>
              {bottomRight}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarCard;
