import { FC } from 'react';
import styles from './CardName.module.scss';
import { joinClasses } from '@/features/Common/utils/utilities';
import Folder from '@/assets/icons/projects/folder.svg?react';
import Highlighter from 'react-highlight-words';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';

interface CardNameProps {
  className?: string;
  isUnassigned?: boolean;
  itemCount?: number;
  name: string;
  searchTerm?: string;
  type: 'project' | 'smartQuery' | 'pathfinderQuery';
}

const CardName: FC<CardNameProps> = ({
  className,
  isUnassigned = false,
  itemCount = 0,
  name,
  searchTerm,
  type,
}) => {
  const icon = type === 'project' ? <Folder /> : null;
  const classes = joinClasses(styles.cardName, className);

  return (
    <div className={classes}>
      {
        !isUnassigned && (
          <div className={styles.icon}>
            {icon}
            {type === 'project' && <span className={styles.iconText}>PROJECT</span>}
            {type === 'smartQuery' && <span className={styles.iconText}>SMART QUERY</span>}
            {type === 'pathfinderQuery' && <span className={styles.iconText}>PATHFINDER QUERY</span>}
          </div>
        )
      }
      <span className={styles.projectTitle}>
        <Highlighter
          highlightClassName="highlight"
          searchWords={searchTerm ? [searchTerm] : []}
          autoEscape={true}
          textToHighlight={name}
          data-tooltip-id="unassigned-project-tooltip"
        />
        {
          (searchTerm && !name.toLowerCase().includes(searchTerm.toLowerCase())) && (
            <>
              <Highlighter
                highlightClassName="highlight"
                searchWords={['*']}
                autoEscape={true}
                textToHighlight="*"
                data-tooltip-id="found-match-in-pks-tooltip"
              />
              <Tooltip id="found-match-in-pks-tooltip" place="top" >
                <span>This project contains a query that matches the search term.</span>
              </Tooltip>
            </>
          )
        }
        {
          isUnassigned && (
            <>
              <InfoIcon data-tooltip-id="unassigned-project-tooltip" className={styles.infoIcon}/>
              <Tooltip id="unassigned-project-tooltip" place="top" >
                <span>Queries that are not associated with any projects are automatically placed here.</span>
              </Tooltip>
            </>
          )
        }
      </span>
      {type === 'project' && (
        <span className={styles.itemCount}>{itemCount > 0 ? itemCount : '0'} Quer{itemCount === 1 ? 'y' : 'ies'}</span>
      )}
    </div>
  );
};

export default CardName;
