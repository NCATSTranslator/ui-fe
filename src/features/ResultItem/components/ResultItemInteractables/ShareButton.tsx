import { FC } from "react";
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import Button from "@/features/Core/components/Button/Button";
import styles from './ResultItemInteractables.module.scss';

interface ShareButtonProps {
  isExpanded: boolean;
  onShareClick: () => void;
  nameStringNoApostrophes: string;
}

const ShareButton: FC<ShareButtonProps> = ({
  isExpanded,
  onShareClick,
  nameStringNoApostrophes
}) => (
  <Button
    className={`${styles.icon} ${styles.shareResultIcon} ${isExpanded ? styles.open : styles.closed } share-result-icon`}
    handleClick={onShareClick}
    dataTooltipId={`share-tooltip-${nameStringNoApostrophes}`}
    variant="secondary"
    small
  >
    <ShareIcon/>
    <Tooltip id={`share-tooltip-${nameStringNoApostrophes}`}>
      <span className={styles.tooltip}>Generate a sharable link for this result.</span>
    </Tooltip>
    <span className={styles.label}>Share</span>
  </Button>
);

export default ShareButton; 