import { FC } from 'react';
import { Link } from 'react-router-dom';
import styles from './ProjectDeletedState.module.scss';
import Button from '@/features/Core/components/Button/Button';
import EmptyArea from '@/features/Projects/components/EmptyArea/EmptyArea';
import RestoreIcon from '@/assets/icons/directional/Undo & Redo/Undo.svg?react';

interface ProjectDeletedStateProps {
  onRestore: () => void;
  restoring?: boolean;
}

/** Shown in place of the project editor when the viewed project is in the trash. */
const ProjectDeletedState: FC<ProjectDeletedStateProps> = ({ onRestore, restoring = false }) => {
  return (
    <EmptyArea heading="This project has been deleted">
      <p className={styles.message}>
        Restore it to keep editing, or go back to your <Link to="/projects">Projects</Link>.
      </p>
      <Button
        handleClick={onRestore}
        disabled={restoring}
        iconLeft={<RestoreIcon />}
        className={styles.restoreButton}
        testId="restore-project-button"
      >
        Restore Project
      </Button>
    </EmptyArea>
  );
};

export default ProjectDeletedState;
