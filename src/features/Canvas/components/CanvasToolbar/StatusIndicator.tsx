import { FC } from 'react';
import styles from './CanvasToolbar.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import type { SaveStatus } from '@/features/Canvas/types/canvas';

interface StatusIndicatorProps {
  saveStatus?: SaveStatus;
}

const STATUS_LABELS: Partial<Record<SaveStatus, string>> = {
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Save failed',
};

const StatusIndicator: FC<StatusIndicatorProps> = ({ saveStatus }) => {
  if (!saveStatus || saveStatus === 'unsaved') return null;

  const label = STATUS_LABELS[saveStatus];
  if (!label) return null;

  return (
    <span
      className={joinClasses(
        styles.saveIndicator,
        saveStatus === 'saved' && styles.visible,
        saveStatus === 'saving' && styles.saving,
        saveStatus === 'error' && styles.saveError,
      )}
      aria-live="polite"
    >
      {label}
    </span>
  );
};

export default StatusIndicator;
