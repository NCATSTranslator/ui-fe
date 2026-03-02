import { FC } from "react";
import SummaryIcon from '@/assets/icons/buttons/SparklesEmpty.svg?react';
import SummaryFilledIcon from '@/assets/icons/buttons/SparklesFilled.svg?react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import Button from "@/features/Core/components/Button/Button";
import styles from './ResultItemInteractables.module.scss';

interface SummaryButtonProps {
  hasSummary: boolean;
  hasCachedSummary: boolean;
  onGenerateSummary: () => void;
  nameStringNoApostrophes: string;
}

const SummaryButton: FC<SummaryButtonProps> = ({
  hasSummary,
  hasCachedSummary,
  onGenerateSummary,
  nameStringNoApostrophes
}) => {
  if (!hasSummary) return null;

  return (
    <Button
      className={styles.icon}
      variant="secondary"
      handleClick={onGenerateSummary}
      dataTooltipId={`summary-tooltip-${nameStringNoApostrophes}`}
      small
    >
      {
        hasCachedSummary ? (
          <SummaryFilledIcon
            aria-describedby={`summary-tooltip-${nameStringNoApostrophes}`}
          />
        ) : (
          <SummaryIcon
            aria-describedby={`summary-tooltip-${nameStringNoApostrophes}`}
          />
        )
      }
      <Tooltip id={`summary-tooltip-${nameStringNoApostrophes}`}>
        <span className={styles.tooltip}>Generate a summary of this result.</span>
      </Tooltip>
      <span className={styles.label}>Summary</span>
    </Button>
  );
};

export default SummaryButton; 