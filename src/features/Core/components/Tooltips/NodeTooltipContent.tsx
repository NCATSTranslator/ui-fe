import { FC } from 'react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import styles from './Tooltips.module.scss';

export interface NodeTooltipContentProps {
  nameString: string;
  typeString: string;
  description?: string;
  provenance?: string | false;
}

const NodeTooltipContent: FC<NodeTooltipContentProps> = ({
  nameString,
  typeString,
  description = '',
  provenance = false,
}) => {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <span><strong>{nameString}</strong> ({typeString})</span>
      {description && <span className={styles.description}>{description}</span>}
      {provenance && typeof provenance === 'string' &&
        <a href={provenance} target="_blank" rel="noreferrer" className={styles.provenance}>
          <ExternalLink />
          <span>{provenance}</span>
        </a>
      }
    </div>
  );
};

export default NodeTooltipContent;
