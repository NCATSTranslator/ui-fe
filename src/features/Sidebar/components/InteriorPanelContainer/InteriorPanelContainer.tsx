import { FC, ReactNode } from "react";
import styles from './InteriorPanelContainer.module.scss';
import { joinClasses } from "@/features/Common/utils/utilities";
import SidebarBackButton from "@/features/Sidebar/components/SidebarBackButton/SidebarBackButton";

interface InteriorPanelContainerProps {
  children: ReactNode;
  className?: string;
  handleBack: () => void;
  backButtonLabel?: string | ReactNode;
}

const InteriorPanelContainer: FC<InteriorPanelContainerProps> = ( { children, className, handleBack, backButtonLabel } ) => {
  
  return (
    <div className={joinClasses(styles.interiorPanelContainer, className)}>
      <div className={styles.top}>
        <SidebarBackButton
          handleClick={handleBack}
          className={styles.backButton}
        >
          {backButtonLabel}
        </SidebarBackButton>
      </div>
      {children}
    </div>
  );
};

export default InteriorPanelContainer;