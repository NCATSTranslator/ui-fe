import { FC } from "react";

interface ProjectDetailErrorStatesProps {
  styles: {[key: string]: string};
  type: 'projects' | 'queries';
}

const ProjectDetailErrorStates: FC<ProjectDetailErrorStatesProps> = ({
  styles,
  type
}) => {

  if(type === 'projects') {
    return (
      <div className={styles.error}>Error loading projects.</div>
    )
  }

  if(type === 'queries') {
    return (
      <div className={styles.error}>Error loading queries.</div>
    )
  }
  return null;
};

export default ProjectDetailErrorStates;