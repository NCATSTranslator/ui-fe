import { useState, FC, Dispatch, SetStateAction } from "react";
import styles from './CombinedQueryInterface.module.scss';
import { Result } from "@/features/ResultList/types/results.d";
import Tabs from "@/features/Common/components/Tabs/Tabs";
import Tab from "@/features/Common/components/Tabs/Tab";
import Query from "@/features/Query/components/Query/Query";
import QueryPathfinder from "@/features/Query/components/QueryPathfinder/QueryPathfinder";
import BetaTag from "@/features/Common/components/BetaTag/BetaTag";
import Button from "@/features/Core/components/Button/Button";
import { useSelector } from "react-redux";
import { currentConfig } from "@/features/UserAuth/slices/userSlice";
import { QueryType } from "@/features/Query/types/querySubmission";
import { ProjectRaw } from "@/features/Projects/types/projects.d";
import { useUserProjects, useUserQueries } from "@/features/Projects/hooks/customHooks";
import Tooltip from "@/features/Common/components/Tooltip/Tooltip";
import EditQueryModal from "@/features/Projects/components/EditQueryModal/EditQueryModal";
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';

interface CombinedQueryInterfaceProps {
  isResults?: boolean;
  loading?: boolean;
  results?: Result[];
  setShareModalFunction?: Dispatch<SetStateAction<boolean>>;
  pk?: string;
  // Query-specific props
  initPresetTypeObject?: QueryType | null;
  initNodeLabelParam?: string | null;
  initNodeIdParam?: string | null;
  nodeDescription?: string | null;
}

const CombinedQueryInterface: FC<CombinedQueryInterfaceProps> = ({
  isResults = false,
  loading = false,
  results = [],
  setShareModalFunction = () => {},
  pk = "",
  // Query-specific props
  initPresetTypeObject = null,
  initNodeLabelParam = null,
  initNodeIdParam = null,
  nodeDescription = null,
}) => {
  const [activeTab, setActiveTab] = useState<string>("Query");
  const config = useSelector(currentConfig);
  const isPathfinderEnabled = config?.include_pathfinder;
  const [selectedProject, setSelectedProject] = useState<ProjectRaw | null>(null);
  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();
  const { data: queries = []} = useUserQueries();
  const [isEditQueryModalOpen, setIsEditQueryModalOpen] = useState<boolean>(false);

  const handleTabSelection = (tabName: string) => {
    setActiveTab(tabName);
  };

  const handleAddToProject = () => {
    setIsEditQueryModalOpen(true);
  };

  return (
    <div className={styles.combinedQueryInterface}>
      <EditQueryModal
        isOpen={isEditQueryModalOpen}
        handleClose={() => setIsEditQueryModalOpen(false)}
        loading={projectsLoading}
        mode="add"
        projects={projects}
        queries={queries}
        setSelectedProject={setSelectedProject}
      />
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
            handleClick={() => setSelectedProject(null)}
            iconOnly
            iconLeft={<CloseIcon />}
            small
          />
        )}
        <Tooltip id="add-to-project-tooltip">
          <p className={styles.tooltipText}>{selectedProject?.data.title || 'Add this query to a project' }</p>
        </Tooltip>
      </div>
      <Tabs
        isOpen={true}
        handleTabSelection={handleTabSelection}
        defaultActiveTab="Smart Query"
        className={styles.tabsContainer}
        tabListClassName={styles.tabList}
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
          />
        </Tab>
        { isPathfinderEnabled 
        ? 
          <Tab 
            heading="Pathfinder Query"
            headingOverride={<BetaTag heading="Pathfinder Query" />}
            className={styles.pathfinderTab}>
            <QueryPathfinder
              isResults={isResults}
              loading={loading}
              results={results}
              setShareModalFunction={setShareModalFunction}
              pk={pk}
              selectedProject={selectedProject}
            />
          </Tab>
          : null}
      </Tabs>
    </div>
  );
};

export default CombinedQueryInterface;