import { FC } from "react";
import Button from "@/features/Core/components/Button/Button"
import CheckmarkIcon from "@/assets/icons/buttons/Checkmark/Checkmark.svg?react";
import CloseIcon from "@/assets/icons/buttons/Close/Close.svg?react";
import TrashIcon from '@/assets/icons/buttons/TrashFilled.svg?react';
import { UseMutationResult } from "@tanstack/react-query";
import { ProjectCreate, ProjectRaw } from "@/features/Projects/types/projects.d";
import { ProjectUpdate } from "@/features/Projects/types/projects.d";

interface ProjectHeaderEditControlButtonsProps {
  createProjectMutation: UseMutationResult<ProjectRaw, Error, ProjectCreate, unknown>;
  handleCancelClick: () => void;
  handleDeleteClick: () => void;
  handleDoneClick: () => void;
  styles: {[key: string]: string};
  type: 'create' | 'update';
  updateProjectsMutation: UseMutationResult<ProjectRaw[], Error, ProjectUpdate[], unknown>;
}

const ProjectHeaderEditControlButtons: FC<ProjectHeaderEditControlButtonsProps> = ({ 
  createProjectMutation,
  handleCancelClick,
  handleDeleteClick,
  handleDoneClick,
  styles,
  type,
  updateProjectsMutation,
}) => {

  const mutation = type === 'create' ? createProjectMutation : updateProjectsMutation;
  return (
    <div className={styles.editButtons}>
    <Button
      iconLeft={<CheckmarkIcon />}
      handleClick={handleDoneClick}
      disabled={mutation.isPending}
      small
      className={styles.doneButton}
    >
      {mutation.isPending ? 'Saving...' : 'Done Editing'}
    </Button>
    <Button
      variant="secondary"
      iconLeft={<CloseIcon />}
      handleClick={handleCancelClick}
      disabled={mutation.isPending}
      small
    >
      Cancel
    </Button>
    <Button
      iconLeft={<TrashIcon />}
      handleClick={handleDeleteClick}
      disabled={mutation.isPending}
      className={styles.deleteButton}
      small
    >
      Delete
    </Button>
  </div>
  );
};

export default ProjectHeaderEditControlButtons;