import { FC, ReactNode, useRef, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollParent = containerRef.current?.closest('.scrollable');
    if (scrollParent) {
      scrollParent.scrollTop = 0;
    }
  }, []);

  return (
    <div ref={containerRef} className={joinClasses(styles.interiorPanelContainer, className)} data-interior-panel>
      <div className={styles.top}>
        <SidebarBackButton
          handleClick={handleBack}
          className={styles.backButton}
        >
          {backButtonLabel}
        </SidebarBackButton>
      </div>
      <div className={`${styles.scrollableContent} scrollable`}>
        {children}
      </div>
    </div>
  );
};

export default InteriorPanelContainer;