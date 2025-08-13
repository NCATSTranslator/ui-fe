import Button from "@/features/Core/components/Button/Button"
import Checkmark from "@/assets/icons/buttons/Checkmark/Checkmark.svg?react";
import Close from "@/assets/icons/buttons/Close/Close.svg?react";
import { UseMutationResult } from "@tanstack/react-query";
import { ProjectCreate, ProjectRaw } from "@/features/Projects/types/projects.d";
import { ProjectUpdate } from "@/features/Projects/types/projects.d";
import { FC } from "react";

interface ProjectHeaderEditControlButtonsProps {
  createProjectMutation: UseMutationResult<ProjectRaw, Error, ProjectCreate, unknown>;
  handleDoneClick: () => void;
  handleCancelClick: () => void;
  styles: {[key: string]: string};
  type: 'create' | 'update';
  updateProjectsMutation: UseMutationResult<ProjectRaw, Error, ProjectUpdate[], unknown>;
}

const ProjectHeaderEditControlButtons: FC<ProjectHeaderEditControlButtonsProps> = ({ 
  handleDoneClick,
  handleCancelClick,
  createProjectMutation,
  styles,
  type,
  updateProjectsMutation
}) => {

  const mutation = type === 'create' ? createProjectMutation : updateProjectsMutation;
  return (
    <div className={styles.editButtons}>
    <Button
      iconLeft={<Checkmark />}
      handleClick={handleDoneClick}
      disabled={mutation.isPending}
      small
      className={styles.doneButton}
    >
      {mutation.isPending ? 'Saving...' : 'Done Editing'}
    </Button>
    <Button
      variant="secondary"
      iconLeft={<Close />}
      handleClick={handleCancelClick}
      disabled={mutation.isPending}
      small
    >
      Cancel
    </Button>
  </div>
  );
};

export default ProjectHeaderEditControlButtons;