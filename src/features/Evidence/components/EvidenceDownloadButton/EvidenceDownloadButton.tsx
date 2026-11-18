import { FC, useId } from 'react';
import Button from '@/features/Core/components/Button/Button';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import ExportIcon from '@/assets/icons/buttons/Export.svg?react';
import { ResultEdge } from '@/features/ResultList/types/results.d';
import { downloadEdgeEvidence } from '@/features/Evidence/utils/evidenceExportUtils';
import { EdgeEvidence } from '@/features/Evidence/utils/utilities';
import styles from './EvidenceDownloadButton.module.scss';

interface EvidenceDownloadButtonProps {
  evidence: EdgeEvidence;
  /** Names the downloaded file after the edge it belongs to. */
  edgeLabel: string | null;
  selectedEdge: ResultEdge | null;
  /** Publication details are still being fetched, so the file would be incomplete. */
  isLoading?: boolean;
}

const EvidenceDownloadButton: FC<EvidenceDownloadButtonProps> = ({
  evidence,
  edgeLabel,
  selectedEdge,
  isLoading = false,
}) => {
  const label = isLoading ? 'Download available once evidence finishes loading' : 'Download this evidence';

  const tooltipId = useId();

  const handleDownload = () => {
    if (isLoading) return;
    downloadEdgeEvidence(evidence, selectedEdge, edgeLabel);
  };

  return (
    <>
      {/* aria-disabled rather than disabled, so the tooltip can still explain why while loading. */}
      <Button
        handleClick={handleDownload}
        ariaLabel={label}
        dataTooltipId={tooltipId}
        variant="secondary"
        iconLeft={<ExportIcon className={styles.icon} />}
        iconOnly
        small
        aria-disabled={isLoading}
      />
      <Tooltip id={tooltipId}>
        <span>{label}</span>
      </Tooltip>
    </>
  );
};

export default EvidenceDownloadButton;
