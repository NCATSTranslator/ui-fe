import { FC, ReactNode, MouseEvent, useCallback, useState, useMemo } from "react";
import styles from "./DataCard.module.scss";
import { joinClasses } from "@/features/Common/utils/utilities";
import OptionsIcon from '@/assets/icons/buttons/Dot Menu/Vertical Dot Menu.svg?react';
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import CardName from "@/features/Projects/components/CardName/CardName";
import Button from "@/features/Core/components/Button/Button";
import OutsideClickHandler from "@/features/Common/components/OutsideClickHandler/OutsideClickHandler";
import OptionsPane from "@/features/Sidebar/components/OptionsPane/OptionsPane";
import { QueryTypeString } from "@/features/Projects/types/projects";

interface DataCardProps {
  icon: ReactNode;
  title: string;
  searchTerm?: string;
  linkTo?: string;
  linkTarget?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  className?: string;
  'data-testid'?: string;
  options?: ReactNode;
  isRenaming?: boolean;
  setIsRenaming?: (isRenaming: boolean) => void;
  onRename?: (value: string) => void;
  type: 'project' | 'query';
  bookmarksCount: number;
  notesCount: number;
  queryCount?: number;
  queryType?: QueryTypeString;
  date: string;
}

const DataCard: FC<DataCardProps> = ({
  icon,
  title,
  searchTerm,
  linkTo,
  linkTarget,
  onClick,
  className,
  'data-testid': testId,
  options,
  isRenaming,
  setIsRenaming,
  onRename,
  type,
  bookmarksCount,
  notesCount,
  queryCount,
  queryType,
  date
}) => {
  const handleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    // Don't trigger onClick if user clicked on a link
    if (linkTo && event.target !== event.currentTarget) {
      return;
    }
    onClick?.(event);
  }, [onClick, linkTo]);

  const cardClassName = joinClasses(styles.dataCard, className, isRenaming && styles.isRenaming, type === 'project' && styles.projectCard, type === 'query' && styles.queryCard);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const queryTypeLabel = useMemo(() => {
    if(queryType === 'drug' || queryType === 'gene' || queryType === 'chemical') return 'Smart Query';
    if(queryType === 'pathfinder') return 'Pathfinder Query';
    return 'Unknown Query Type';
  }, [queryType]);

  return (
    <div 
      className={cardClassName}
      onClick={onClick ? handleClick : undefined}
      data-testid={testId}
    >
      <div className={styles.container}>
        <CardName
          title={title}
          searchTerm={searchTerm}
          linkTo={linkTo}
          linkTarget={linkTarget}
          isRenaming={isRenaming}
          setIsRenaming={setIsRenaming}
          onRename={onRename}
          icon={icon}
        />
        <div className={styles.bookmarksColumn}>
          <BookmarkIcon />
          {bookmarksCount}
        </div>
        <div className={styles.notesColumn}>
          <NoteIcon />
          {notesCount}
        </div>
        <div className={styles.queriesColumn}>
          {
            type === 'project' ? (
              <>
                {!!queryCount && `${queryCount} Quer${queryCount === 1 ? 'y' : 'ies'}`}
              </>
            ) : (
              !!queryType && queryTypeLabel
            )
          }
        </div>
        <div className={styles.date}>
          {date}
        </div>
        {
          options &&
          (        
            <div className={styles.optionsColumn}>
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
    </div>
  );
};

export default DataCard;
