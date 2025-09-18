import { useMemo } from "react";
import styles from "./ProjectsPanel.module.scss";
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import SidebarProjectCard from "@/features/Sidebar/components/SidebarProjectCard/SidebarProjectCard";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import { useProjectListData } from "@/features/Projects/hooks/useProjectListData";

const ProjectsPanel = () => {
  const user = useSelector(currentUser);
  const data = useProjectListData();
  const projects = useMemo(() => data.formatted.active, [data.formatted.active]);
  const projectsLoading = data.loading.projectsLoading;

  return (
    <div className={styles.projectsPanel}>
      <div className={styles.top}>
        <TextInput iconLeft={<SearchIcon />} handleChange={() => {}} placeholder="Search Projects" />
      </div>
      <div className={styles.list}>
        {
          !user ? (
            <div className={styles.empty}>
              <p>
                <a href="/login" className={styles.link}>Log in</a> to view your saved projects.
              </p>
            </div>
          ) : (
            <LoadingWrapper loading={projectsLoading} contentClassName={styles.projectsList}>
              {projects.map((project) => (
                <SidebarProjectCard key={project.id} project={project} />
              ))}
            </LoadingWrapper>
          )
        }
      </div>
    </div>
  );
};

export default ProjectsPanel;