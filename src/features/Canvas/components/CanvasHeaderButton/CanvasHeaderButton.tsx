import { FC } from 'react';
import styles from './CanvasHeaderButton.module.scss';
import useCanvasPane from '@/features/Canvas/hooks/useCanvasPane';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import WorkspaceIcon from '@/assets/icons/navigation/Workspace.svg?react';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';

const CanvasHeaderButton: FC = () => {
  const { paneOpen, activeCanvas, togglePane, createCanvas } = useCanvasPane();

  const handleClick = () => {
    if (activeCanvas) {
      togglePane();
    } else {
      createCanvas();
    }
  };

  return (
    <button
      className={joinClasses(styles.canvasButton, paneOpen && styles.active)}
      onClick={handleClick}
      aria-label="Toggle canvas"
    >
      <WorkspaceIcon />
      Canvas
      <ChevDown />
    </button>
  );
};

export default CanvasHeaderButton;
