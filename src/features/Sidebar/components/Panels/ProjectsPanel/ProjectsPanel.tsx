import { FC, useMemo } from "react";
import styles from "./ProjectsPanel.module.scss";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { joinClasses } from "@/features/Common/utils/utilities";
import SidebarProjectList from "@/features/Sidebar/components/SidebarProjectList/SidebarProjectList";
import SidebarBackButton from "@/features/Sidebar/components/SidebarBackButton/SidebarBackButton";

interface ProjectsPanelProps {
  className?: string;
}

const ProjectsPanel: FC<ProjectsPanelProps> = ({
  className = ''
}) => {

  const { addToProjectQuery, isSelectedProjectMode, clearAddToProjectMode, setSelectedProjectMode }= useSidebar();

  // Selection mode is active if we are in add-to-project mode or selected project mode
  const selectionModeActive = useMemo(() => {
    return addToProjectQuery !== null || isSelectedProjectMode;
  }, [addToProjectQuery, isSelectedProjectMode]);

  const handleCloseProjectList = () => {
    clearAddToProjectMode();
    setSelectedProjectMode(false);
  };

  return (
    <div className={joinClasses(styles.projectsPanel, selectionModeActive && `${styles.selectionModeActive} selectionModeActive`, className)}>
      {
        selectionModeActive &&
        <SidebarBackButton label="Select Project" handleClick={handleCloseProjectList} />
      }
      <SidebarProjectList className={joinClasses(selectionModeActive ? `${styles.paddedProjectsList} scrollable` : '')} />
    </div>
  );
};

export default ProjectsPanel;