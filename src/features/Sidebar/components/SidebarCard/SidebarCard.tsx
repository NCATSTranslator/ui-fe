import { FC, ReactNode, MouseEvent, useState, FormEvent, RefObject } from "react";
import styles from "./SidebarCard.module.scss";
import { joinClasses } from "@/features/Common/utils/utilities";
import OptionsIcon from '@/assets/icons/buttons/Dot Menu/Vertical Dot Menu.svg?react';
import SidebarCardTitle from "@/features/Sidebar/components/SidebarCardTitle/SidebarCardTitle";
import Button from "@/features/Core/components/Button/Button";
import OutsideClickHandler from "@/features/Common/components/OutsideClickHandler/OutsideClickHandler";
import OptionsPane from "@/features/Sidebar/components/OptionsPane/OptionsPane";
import CardWrapper from "@/features/Projects/components/CardWrapper/CardWrapper";

interface SidebarCardProps {
  ignoreTitleMatch?: boolean;
  leftIcon: ReactNode;
  rightIcon?: ReactNode;
  title: string;
  searchTerm?: string;
  linkTo?: string;
  linkTarget?: string;
  // onClick overrides linkTo
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  // Bottom content (metadata, counts, etc.)
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;
  className?: string;
  'data-testid'?: string;
  options?: ReactNode;
  isRenaming?: boolean;
  onTitleChange?: (value: string) => void;
  onFormSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  textInputRef?: RefObject<HTMLInputElement | null>;
}

const SidebarCard: FC<SidebarCardProps> = ({
  ignoreTitleMatch = false,
  leftIcon,
  rightIcon,
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
  onTitleChange,
  onFormSubmit,
  textInputRef
}) => {

  const cardClassName = joinClasses(styles.sidebarCard, className, isRenaming && styles.isRenaming);
  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <CardWrapper 
      className={cardClassName}
      onClick={onClick}
      linkTo={linkTo}
      linkTarget={linkTarget}
      testId={testId}
    >
      <div className={styles.leftSection}>
        {leftIcon}
      </div>
      <div className={styles.content}>
        <SidebarCardTitle
          ignoreTitleMatch={ignoreTitleMatch}
          title={title}
          searchTerm={searchTerm}
          linkTo={linkTo}
          linkTarget={linkTarget}
          isRenaming={isRenaming}
          onTitleChange={onTitleChange}
          onFormSubmit={onFormSubmit}
          textInputRef={textInputRef}
          rightIcon={rightIcon}
        />
        {(bottomLeft || bottomRight) && (
          <div className={styles.bottom}>
            {bottomLeft && bottomLeft}
            {bottomRight && bottomRight}
          </div>
        )}
        {
          options &&
          (        
            <div className={styles.options}>
              <OutsideClickHandler onOutsideClick={()=>setOptionsOpen(false)}>
                <Button className={styles.optionsButton} handleClick={()=>setOptionsOpen(prev=>!prev)}>
                  <OptionsIcon />
                </Button>
              </OutsideClickHandler>
              <OptionsPane open={optionsOpen}>
                {options && options}
              </OptionsPane>
            </div>
          )
        }
      </div>
    </CardWrapper>
  );
};

export default SidebarCard;
