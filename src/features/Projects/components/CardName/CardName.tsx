import { FC } from 'react';
import styles from './CardName.module.scss';
import { joinClasses } from '@/features/Common/utils/utilities';
import Folder from '@/assets/icons/projects/folder.svg?react';

interface CardNameProps {
  className?: string;
  itemCount?: number;
  name: string;
  type: 'project' | 'smartQuery' | 'pathfinderQuery';
}

const CardName: FC<CardNameProps> = ({
  className,
  itemCount = 0,
  name,
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
      <span className={styles.projectTitle}>{name}</span>
      { type === 'project' && 
        <span className={styles.itemCount}>{itemCount > 0 ? itemCount : '--' } Quer{itemCount === 1 ? 'y' : 'ies'}</span>
      }
      { (type === 'smartQuery' || type === 'pathfinderQuery') && 
        <span className={styles.itemCount}>{itemCount > 0 ? itemCount : '--' } Result{itemCount === 1 ? '' : 's'}</span>
      }
    </div>
  )
}

export default CardName;