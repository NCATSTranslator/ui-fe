import { FC } from "react";
import { Link } from 'react-router-dom';
import Notes from "@/assets/icons/buttons/Notes/Notes.svg?react"
import NotesFilled from "@/assets/icons/buttons/Notes/Filled Notes.svg?react"
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import Button from "@/features/Core/components/Button/Button";
import styles from './ResultItemInteractables.module.scss';

interface NotesButtonProps {
  hasUser: boolean;
  isPathfinder: boolean;
  hasNotes: boolean;
  onNotesClick: () => Promise<void>;
  nameStringNoApostrophes: string;
}

const NotesButton: FC<NotesButtonProps> = ({
  hasUser,
  isPathfinder,
  hasNotes,
  onNotesClick,
  nameStringNoApostrophes
}) => {
  if (!hasUser || isPathfinder) return null;

  return (
    <Button 
      className={`${styles.icon} ${styles.notesIcon} ${hasNotes ? styles.filled : ''}`}
      handleClick={onNotesClick}
      dataTooltipId={`notes-tooltip-${nameStringNoApostrophes}`}
      variant="secondary"
      small
    >
      <NotesFilled 
        className={styles.notesFilledSVG}
        data-result-name={nameStringNoApostrophes}
        aria-describedby={`notes-tooltip-${nameStringNoApostrophes}`}
      />
      <Notes 
        className='note-icon'
        data-result-name={nameStringNoApostrophes}
        aria-describedby={`notes-tooltip-${nameStringNoApostrophes}`}
      />
      <Tooltip id={`notes-tooltip-${nameStringNoApostrophes}`}>
        <span className={styles.tooltip}>
          Add your own custom notes to this result. <br/> 
          (You can also view and edit notes on your<br/> 
          bookmarked results in the <Link to="/workspace" target='_blank'>Workspace</Link>).
        </span>
      </Tooltip>
      <span className={styles.label}>Notes</span>
    </Button>
  );
};

export default NotesButton; 