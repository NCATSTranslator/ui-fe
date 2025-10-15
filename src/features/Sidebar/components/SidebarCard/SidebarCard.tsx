import { FC, ReactNode, MouseEvent, useCallback, useState } from "react";
import styles from "./SidebarCard.module.scss";
import { joinClasses } from "@/features/Common/utils/utilities";
import OptionsIcon from '@/assets/icons/buttons/Dot Menu/Vertical Dot Menu.svg?react';
import SidebarCardTitle from "@/features/Sidebar/components/SidebarCardTitle/SidebarCardTitle";
import Button from "@/features/Core/components/Button/Button";
import OutsideClickHandler from "@/features/Common/components/OutsideClickHandler/OutsideClickHandler";
import OptionsPane from "../OptionsPane/OptionsPane";

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
  options?: ReactNode;
  isRenaming?: boolean;
  setIsRenaming?: (isRenaming: boolean) => void;
  onRename?: (value: string) => void;
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
  'data-testid': testId,
  options,
  isRenaming,
  setIsRenaming,
  onRename
}) => {
  const handleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    // Don't trigger onClick if user clicked on a link
    if (linkTo && event.target !== event.currentTarget) {
      return;
    }
    onClick?.(event);
  }, [onClick, linkTo]);

  const cardClassName = joinClasses(styles.sidebarCard, className, isRenaming && styles.isRenaming);
  const [optionsOpen, setOptionsOpen] = useState(false);

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
          isRenaming={isRenaming}
          setIsRenaming={setIsRenaming}
          onRename={onRename}
        />
        {(bottomLeft || bottomRight) && (
          <div className={styles.bottom}>
            {bottomLeft && bottomLeft}
            {bottomRight && bottomRight}
          </div>
        )}
      </div>
      {
        options &&
        (        
          <>
            <OutsideClickHandler onOutsideClick={()=>setOptionsOpen(false)}>
              <Button className={styles.optionsButton} handleClick={()=>setOptionsOpen(prev=>!prev)}>
                <OptionsIcon />
              </Button>
            </OutsideClickHandler>
            <OptionsPane open={optionsOpen}>
              {options && options}
            </OptionsPane>
          </>
        )
      }
    </div>
  );
};

export default SidebarCard;
