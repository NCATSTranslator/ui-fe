import { FC } from "react";

interface ProjectInnerErrorStatesProps {
  styles: {[key: string]: string};
  type: 'projects' | 'queries';
}

const ProjectInnerErrorStates: FC<ProjectInnerErrorStatesProps> = ({
  styles,
  type
}) => {
  return (
    <div className={styles.projectInnerErrorStates}>
      {
        type === 'projects' && (
          <div className={styles.error}>Error loading projects.</div>
        )
      } 
      {
        type === 'queries' && (
          <div className={styles.error}>Error loading queries.</div>
        )
      }
    </div>
  );
};

export default ProjectInnerErrorStates;