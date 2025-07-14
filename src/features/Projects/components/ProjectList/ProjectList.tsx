import styles from './ProjectList.module.scss';
import ProjectListHeader from '../ProjectListHeader/ProjectListHeader';

const ProjectList = () => {
  
  return (
    <div className={styles.projectList}>
      <ProjectListHeader />
    </div>
  );
}

export default ProjectList;