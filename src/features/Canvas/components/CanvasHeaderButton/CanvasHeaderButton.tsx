import { FC } from 'react';
import styles from './CanvasHeaderButton.module.scss';
import useCanvasPane from '@/features/Canvas/hooks/useCanvasPane';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';
import { useUser } from '@/features/UserAuth/utils/userApi';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import WorkspaceIcon from '@/assets/icons/navigation/Workspace.svg?react';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';

const CanvasHeaderButton: FC = () => {
  const [user] = useUser();
  const { paneOpen, activeCanvas, togglePane } = useCanvasPane();
  const { createCanvas } = useCreateCanvas();
  const disabled = !user;

  const handleClick = () => {
    if (disabled) return;
    if (activeCanvas) {
      togglePane();
    } else {
      createCanvas();
    }
  };

  return (
    <>
      <button
        className={joinClasses(styles.canvasButton, paneOpen && styles.active)}
        onClick={handleClick}
        disabled={disabled}
        aria-label="Toggle canvas"
        data-tooltip-id="canvas-header-btn-tooltip"
      >
        <WorkspaceIcon />
        Canvas
        <ChevDown />
      </button>
      {disabled && (
        <Tooltip id="canvas-header-btn-tooltip" place="bottom">
          Log In to Access Canvas
        </Tooltip>
      )}
    </>
  );
};

export default CanvasHeaderButton;
