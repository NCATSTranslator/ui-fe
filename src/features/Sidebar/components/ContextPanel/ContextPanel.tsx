import { FC, ReactNode } from "react";
import styles from './ContextPanel.module.scss';
import Button from "@/features/Core/components/Button/Button";
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";

interface ContextPanelProps {
  panel: ReactNode;
  title: string;
}

const ContextPanel: FC<ContextPanelProps> = ({ panel, title }) => {
  const { closePanel } = useSidebar();

  return (
    <div className={styles.contextPanel}>
      <div className={styles.header}>
        <h6 className={styles.title}>{title}</h6>
        <Button 
          handleClick={closePanel}
          iconLeft={<CloseIcon />}
          iconOnly
          variant="secondary"
        />
      </div>
      {panel}
    </div>
  );
};

export default ContextPanel;