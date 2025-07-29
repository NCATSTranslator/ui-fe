import { FC } from 'react';
import styles from './CardName.module.scss';
import { joinClasses } from '@/features/Common/utils/utilities';
import Folder from '@/assets/icons/projects/folder.svg?react';
import Highlighter from 'react-highlight-words';

interface CardNameProps {
  className?: string;
  itemCount?: number;
  name: string;
  searchTerm?: string;
  type: 'project' | 'smartQuery' | 'pathfinderQuery';
}

const CardName: FC<CardNameProps> = ({
  className,
  itemCount = 0,
  name,
  searchTerm,
  type,
}) => {
  const icon = type === 'project' ? <Folder /> : null;
  const classes = joinClasses(styles.cardName, className);

  return (
    <div className={classes}>
      <div className={styles.icon}>
        { icon }
        { type === 'project' && <span className={styles.iconText}>PROJECT</span>}
        { type === 'smartQuery' && <span className={styles.iconText}>SMART QUERY</span>}
        { type === 'pathfinderQuery' && <span className={styles.iconText}>PATHFINDER QUERY</span>}
      </div>
      <span className={styles.projectTitle}>
        <Highlighter
          highlightClassName="highlight"
          searchWords={searchTerm ? [searchTerm] : []}
          autoEscape={true}
          textToHighlight={name}
        />
      </span>
      { type === 'project' && 
        <span className={styles.itemCount}>{itemCount > 0 ? itemCount : '0' } Quer{itemCount === 1 ? 'y' : 'ies'}</span>
      }
    </div>
  )
}

export default CardName;