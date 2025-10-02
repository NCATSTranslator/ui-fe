import { FC, ReactNode } from "react";
import styles from './ContextPanel.module.scss';
import Button from "@/features/Core/components/Button/Button";
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";

interface ContextPanelProps {
  buttonComponent?: ReactNode;
  panel: ReactNode;
  title: string;
}

const ContextPanel: FC<ContextPanelProps> = ({ buttonComponent, panel, title }) => {
  const { closePanel } = useSidebar();

  return (
    <div className={`${styles.contextPanel} scrollable`}>
      <div className={styles.header}>
        <h6 className={styles.title}>{title}</h6>
        <div className={styles.buttonContainer}>
          {buttonComponent && buttonComponent}
          <Button
            handleClick={closePanel}
            iconLeft={<CloseIcon />}
            iconOnly
            variant="secondary"
          />
        </div>
      </div>
      <div className={styles.content}>
        {panel}
      </div>
    </div>
  );
};

export default ContextPanel;