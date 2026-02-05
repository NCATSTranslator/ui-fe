import { FC, ReactNode } from 'react';
import styles from './SidebarTransitionButton.module.scss';
import Button from '@/features/Core/components/Button/Button';
import { joinClasses } from '@/features/Common/utils/utilities';
import ChevRight from "@/assets/icons/directional/Chevron/Chevron Right.svg?react";

interface SidebarTransitionButtonProps {
  children?: ReactNode;
  className?: string;
  handleClick: () => void;
  label?: string;
}

const SidebarTransitionButton: FC<SidebarTransitionButtonProps> = ({ children, className, handleClick, label }) => {
  return (
    <Button 
      className={joinClasses(styles.sidebarTransitionButton, className)}
      handleClick={handleClick}
      iconRight={label ? <ChevRight className={styles.rightArrow}/> : null}
    >
      {children || label}
    </Button>
  );
};

export default SidebarTransitionButton;