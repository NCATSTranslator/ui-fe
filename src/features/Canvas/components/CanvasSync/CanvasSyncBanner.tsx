import { FC } from 'react';
import styles from './CanvasSyncBanner.module.scss';

/**
 * Shown when this canvas has changed elsewhere but the update is being held back because the user
 * has edits of their own still saving. Sync applies the change as soon as those settle, so this is
 * normally a brief flash — it only lingers while the user keeps typing or dragging.
 */
const CanvasSyncBanner: FC = () => (
  <div className={styles.banner} role="status">
    <span className={styles.dot} aria-hidden="true" />
    <span>This canvas was updated elsewhere. Your changes are saving: the update will appear once they finish.</span>
  </div>
);

export default CanvasSyncBanner;
