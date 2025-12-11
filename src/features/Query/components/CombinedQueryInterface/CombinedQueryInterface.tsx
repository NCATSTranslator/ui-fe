import { FC, Dispatch, SetStateAction, useEffect } from "react";
import styles from './CombinedQueryInterface.module.scss';
import { Result } from "@/features/ResultList/types/results.d";
import Tabs from "@/features/Common/components/Tabs/Tabs";
import Tab from "@/features/Common/components/Tabs/Tab";
import Query from "@/features/Query/components/Query/Query";
import QueryPathfinder from "@/features/Query/components/QueryPathfinder/QueryPathfinder";
import BetaTag from "@/features/Common/components/BetaTag/BetaTag";
import Button from "@/features/Core/components/Button/Button";
import { useSelector } from "react-redux";
import { currentConfig, currentUser } from "@/features/UserAuth/slices/userSlice";
import { QueryType } from "@/features/Query/types/querySubmission";
import { ProjectRaw } from "@/features/Projects/types/projects.d";
import { joinClasses } from "@/features/Common/utils/utilities";
import Tooltip from "@/features/Common/components/Tooltip/Tooltip";
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";

interface CombinedQueryInterfaceProps {
  className?: string;
  defaultProject?: ProjectRaw | null;
  isResults?: boolean;
  loading?: boolean;
  results?: Result[];
  setShareModalFunction?: Dispatch<SetStateAction<boolean>>;
  pk?: string;
  projectPage?: boolean;  
  // Query-specific props
  initPresetTypeObject?: QueryType | null;
  initNodeLabelParam?: string | null;
  initNodeIdParam?: string | null;
  nodeDescription?: string | null;
  submissionCallback?: () => void;
}

const CombinedQueryInterface: FC<CombinedQueryInterfaceProps> = ({
  className = '',
  defaultProject = null,
  isResults = false,
  loading = false,
  results = [],
  setShareModalFunction = () => {},
  pk = "",
  projectPage = false,
  // Query-specific props
  initPresetTypeObject = null,
  initNodeLabelParam = null,
  initNodeIdParam = null,
  nodeDescription = null,
  submissionCallback = () => {},
}) => {
  const config = useSelector(currentConfig);
  const user = useSelector(currentUser);
  const { activePanelId, togglePanel, isSelectedProjectMode, setSelectedProjectMode, selectedProject, setSelectedProject, clearSelectedProject } = useSidebar();
  const isPathfinderEnabled = config?.include_pathfinder;
  const showAddToProject = !!user && config?.include_projects;

  const handleAddToProject = () => {
    if(activePanelId !== 'queries')
      togglePanel('queries');

    if(activePanelId === 'queries' && isSelectedProjectMode) {
      togglePanel('queries');
      setSelectedProjectMode(false);
    } else {
      setSelectedProjectMode(true);
    } 
  };

  const classNames = joinClasses(styles.combinedQueryInterface, projectPage  && styles.projectPage, className);
  const shouldNavigate = !projectPage;

  useEffect(() => {
    if(defaultProject)
      setSelectedProject(defaultProject);
  }, [defaultProject]);

  return (
    <div className={classNames}>
      {showAddToProject && (
        <div className={styles.addToProject} data-tooltip-id="add-to-project-tooltip">
          <span className={styles.label}>Add to</span>
          <Button
            className={styles.button}
            handleClick={handleAddToProject}
            iconLeft={<FolderIcon/>}
          >
            <span className={styles.projectName}>{selectedProject?.data.title || 'Select Project'}</span>
          </Button>
          {selectedProject && (
            <Button
              className={`${styles.removeSelectedProject} ${styles.button}`}
              handleClick={() => clearSelectedProject()}
              iconOnly
              iconLeft={<CloseIcon />}
              small
            />
          )}
          <Tooltip id="add-to-project-tooltip">
            <span className={styles.tooltipText}>{selectedProject?.data.title || 'Add this query to a project' }</span>
          </Tooltip>
        </div>
      )}
      <Tabs
        isOpen={true}
        defaultActiveTab="Smart Query"
        className={styles.tabsContainer}
        tabListClassName={styles.tabList}
        tabListWrapperClassName={styles.tabListWrapper}
      >
        <Tab heading="Smart Query" className={styles.queryTab}>
          <Query
            isResults={isResults}
            loading={loading}
            initPresetTypeObject={initPresetTypeObject}
            initNodeLabelParam={initNodeLabelParam}
            initNodeIdParam={initNodeIdParam}
            nodeDescription={nodeDescription}
            setShareModalFunction={setShareModalFunction}
            results={results}
            pk={pk}
            selectedProject={selectedProject}
            combinedStyles={styles}
            shouldNavigate={shouldNavigate}
            submissionCallback={submissionCallback}
          />
        </Tab>
        { isPathfinderEnabled 
        ? 
          <Tab 
            heading="Pathfinder Query"
            headingOverride={<BetaTag heading="Pathfinder Query" tagClassName={projectPage ? styles.betaTag : ''} />}
            className={styles.pathfinderTab}>
            <QueryPathfinder
              isResults={isResults}
              loading={loading}
              results={results}
              setShareModalFunction={setShareModalFunction}
              pk={pk}
              selectedProject={selectedProject}
              user={user}
              shouldNavigate={shouldNavigate}
              submissionCallback={submissionCallback}
            />
          </Tab>
          : null}
      </Tabs>
    </div>
  );
};

export default CombinedQueryInterface;