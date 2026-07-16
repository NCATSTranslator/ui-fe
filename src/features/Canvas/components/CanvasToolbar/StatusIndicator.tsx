import { FC } from 'react';
import styles from './CanvasToolbar.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import type { SaveStatus } from '@/features/Canvas/types/canvas';

interface StatusIndicatorProps {
  isProcessing?: boolean;
  saveStatus?: SaveStatus;
}

const StatusIndicator: FC<StatusIndicatorProps> = ({ isProcessing, saveStatus }) => {
  if (isProcessing) return <span className={styles.processingIndicator}>Processing...</span>;
  if (!saveStatus || saveStatus === 'unsaved') return null;
  return (
    <span className={joinClasses(
      styles.saveIndicator,
      saveStatus === 'saving' && styles.saving,
      saveStatus === 'error' && styles.saveError,
    )}>
      {saveStatus === 'saving' && 'Saving...'}
      {saveStatus === 'saved' && 'Saved'}
      {saveStatus === 'error' && 'Save failed'}
    </span>
  );
};

export default StatusIndicator;
