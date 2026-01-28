import { FC } from "react";
import { KnowledgeLevelFilterType } from "@/features/Evidence/types/evidence";
import styles from "@/features/Evidence/components/PublicationsTable/PublicationsTable.module.scss";
import Info from "@/assets/icons/status/Alerts/Info.svg?react";
import Tooltip from "@/features/Core/components/Tooltip/Tooltip";

const KnowledgeLevelFilter: FC<{
  filter: KnowledgeLevelFilterType;
  availableLevels: Set<string>;
  onFilterChange: (level: KnowledgeLevelFilterType) => void;
}> = ({ filter, availableLevels, onFilterChange }) => (
  <div className={styles.knowledgeLevelOptions}>
    <p className={styles.knowledgeLevelLabel}>
      Knowledge Level <Info data-tooltip-id='knowledge-level-tooltip' />
    </p>
    <Tooltip id='knowledge-level-tooltip'>
      <span className={styles.knowledgeLevelTooltip}>
        Denotes the type of reasoning used to attribute a given publication to the selected relationship.
      </span>
    </Tooltip>
    <div>
      {(['all', 'trusted', 'ml'] as const).map((level) => (
        <button
          key={level}
          className={`${styles.knowledgeLevelButton} ${filter === level ? styles.selected : ''}`}
          onClick={() => onFilterChange(level)}
          disabled={level !== 'all' && !availableLevels.has(level)}
        >
          {level === 'all' ? 'All' : level === 'trusted' ? 'Curated' : 'Text-Mined'}
        </button>
      ))}
    </div>
  </div>
);

export default KnowledgeLevelFilter;