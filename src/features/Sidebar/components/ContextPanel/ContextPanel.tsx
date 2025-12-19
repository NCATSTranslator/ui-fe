import { FC, ReactNode, useCallback, useMemo, useEffect } from "react";
import styles from './ContextPanel.module.scss';
import Button from "@/features/Core/components/Button/Button";
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { SidebarItemId } from "@/features/Sidebar/types/sidebar";

interface ContextPanelProps {
  activePanelId: SidebarItemId | 'none';
  buttonComponent?: ReactNode;
  panel: ReactNode;
  title: string;
}

const ContextPanel: FC<ContextPanelProps> = ({
  activePanelId,
  buttonComponent,
  panel,
  title
}) => {
  const { closePanel, setSelectedProjectMode, isSelectedProjectMode } = useSidebar();

  const reduceSpacing = useMemo(() => {
    if(activePanelId === 'filters') return true;
    return false;
  }, [activePanelId]);

  const handleClosePanel = useCallback(() => {
    closePanel();
    setSelectedProjectMode(false);
  }, [closePanel, setSelectedProjectMode]);

  useEffect(() => {
    // If the panel is not the queries panel and we are in selected project mode, close the selected project mode
    if(activePanelId !== 'queries' && isSelectedProjectMode)
      setSelectedProjectMode(false);
  }, [closePanel, setSelectedProjectMode, isSelectedProjectMode, activePanelId]);

  return (
    <div className={`${styles.contextPanel}  ${reduceSpacing && styles.reduceSpacing}`}>
      <div className={styles.header}>
        <h6 className={styles.title}>{title}</h6>
        <div className={styles.buttonContainer}>
          {buttonComponent && buttonComponent}
          <Button
            handleClick={handleClosePanel}
            iconLeft={<CloseIcon />}
            iconOnly
            variant="secondary"
          />
        </div>
      </div>
      <div className={`${styles.content} scrollable`}>
        {panel}
      </div>
    </div>
  );
};

export default ContextPanel;