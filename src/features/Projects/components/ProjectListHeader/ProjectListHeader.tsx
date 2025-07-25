import Button from '@/features/Core/components/Button/Button';
import styles from './ProjectListHeader.module.scss';
import FolderPlus from '@/assets/icons/projects/folderplus.svg?react';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import Search from '@/assets/icons/buttons/search.svg?react';

const ProjectListHeader = () => {
  return (
    <div className={styles.projectListHeader}>
      <div className={styles.left}>
        <h1 className={`h4`}>Projects</h1>
        <Button
          iconLeft={<FolderPlus />}
        >
          Create New
        </Button>
      </div>
      <div className={styles.right}>
        <TextInput
          placeholder="Search by Project or Query Name"
          iconLeft={<Search />}
          handleChange={() => {}}
          className={styles.searchInput}
        />
      </div>
    </div>
  );
}

export default ProjectListHeader;