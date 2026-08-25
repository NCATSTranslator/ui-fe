import { FC, useEffect, useState } from "react";
import styles from './CombinedQueryInterface.module.scss';
import Tabs from "@/features/Core/components/Tabs/Tabs";
import Tab from "@/features/Core/components/Tabs/Tab";
import Query from "@/features/Query/components/Query/Query";
import QueryPathfinder from "@/features/Query/components/QueryPathfinder/QueryPathfinder";
import QueryLookup from "@/features/Query/components/QueryLookup/QueryLookup";
import BetaTag from "@/features/Core/components/BetaTag/BetaTag";
import Button from "@/features/Core/components/Button/Button";
import { useSelector } from "react-redux";
import { currentConfig, currentUser } from "@/features/UserAuth/slices/userSlice";
import { QueryType } from "@/features/Query/types/querySubmission";
import { ProjectRaw } from "@/features/Projects/types/projects.d";
import { joinClasses } from "@/features/Core/utils/classHelpers";
import Tooltip from "@/features/Core/components/Tooltip/Tooltip";
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  getHomeQueryTabHeading,
  HOME_QUERY_NODE_ID_PARAM,
  HOME_QUERY_NODE_LABEL_PARAM,
  HOME_QUERY_NODE_CATEGORY_PARAM,
  HOME_QUERY_TAB_HEADING,
  HOME_QUERY_TAB_PARAM,
  isHomeQueryTabEnabled,
  homeQueryTabOptionsFromConfig,
} from "@/features/Query/utils/homeQueryParams";
import { noop } from "@/features/Core/utils/constants";

interface CombinedQueryInterfaceProps {
  className?: string;
  defaultProject?: ProjectRaw | null;
  isResults?: boolean;
  projectPage?: boolean;
  // Query-specific props
  initPresetTypeObject?: QueryType | null;
  initNodeLabelParam?: string | null;
  initNodeIdParam?: string | null;
  initNodeCategoryParam?: string | null;
  submissionCallback?: () => void;
}

const CombinedQueryInterface: FC<CombinedQueryInterfaceProps> = ({
  className = '',
  defaultProject = null,
  isResults = false,
  projectPage = false,
  // Query-specific props
  initPresetTypeObject = null,
  initNodeLabelParam = null,
  initNodeIdParam = null,
  initNodeCategoryParam = null,
  submissionCallback = noop,
}) => {
  const config = useSelector(currentConfig);
  const user = useSelector(currentUser);
  const location = useLocation();
  const {
    activePanelId,
    togglePanel,
    isSelectedProjectMode,
    setSelectedProjectMode,
    selectedProject,
    setSelectedProject,
    clearSelectedProject
  } = useSidebar();
  const isPathfinderEnabled = isHomeQueryTabEnabled('pathfinder', homeQueryTabOptionsFromConfig(config));
  const isLookupEnabled = isHomeQueryTabEnabled('lookup', homeQueryTabOptionsFromConfig(config));
  const showAddToProject = !!user && config?.include_projects;
  const [searchParams] = useSearchParams();
  const nodeId = searchParams.get(HOME_QUERY_NODE_ID_PARAM) ?? initNodeIdParam;
  const nodeLabel = searchParams.get(HOME_QUERY_NODE_LABEL_PARAM) ?? initNodeLabelParam;
  const nodeCategory = searchParams.get(HOME_QUERY_NODE_CATEGORY_PARAM) ?? initNodeCategoryParam;
  const tabFromUrl = getHomeQueryTabHeading(searchParams.get(HOME_QUERY_TAB_PARAM), homeQueryTabOptionsFromConfig(config));
  const fallbackTab = isLookupEnabled ? HOME_QUERY_TAB_HEADING.lookup : HOME_QUERY_TAB_HEADING.smart;
  const [activeTab, setActiveTab] = useState(tabFromUrl ?? fallbackTab);

  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

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

  const onSubmitCallback = () => {
    submissionCallback();
    clearSelectedProject();
  };

  // On navigation, apply defaultProject if provided, otherwise clear the selected project
  useEffect(() => {
    if (defaultProject)
      setSelectedProject(defaultProject);
    else
      clearSelectedProject();
  }, [location.pathname, defaultProject?.id]);

  return (
    <div className={classNames}>
      {showAddToProject && (
        <div className={styles.addToProject} data-tooltip-id="add-to-project-tooltip">
          {
            (projectPage && defaultProject && selectedProject)
              ? (
                <div className={styles.addingToProject}>
                  <span className={styles.label}>Adding to</span>
                  <span className={styles.projectName}>{selectedProject?.data.title}</span>
                </div>
              )
              : (
                <>
                  <span className={styles.label}>Add to</span>
                  <Button
                    className={styles.button}
                    handleClick={handleAddToProject}
                    iconLeft={<FolderIcon/>}
                  >
                    <span className={styles.projectName}>{selectedProject?.data.title || 'Project'}</span>
                  </Button>
                </>
              )
          }

          {(!projectPage && selectedProject) && (
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
        controlled
        activeTab={activeTab}
        handleTabSelection={setActiveTab}
        className={styles.tabsContainer}
        tabListClassName={styles.tabList}
        tabListWrapperClassName={styles.tabListWrapper}
      >
        { isLookupEnabled ?
          <Tab
            heading={HOME_QUERY_TAB_HEADING.lookup}
            className={styles.lookupTab}
          >
            <QueryLookup
              isResults={isResults}
              selectedProject={selectedProject}
              user={user}
              shouldNavigate={shouldNavigate}
              submissionCallback={onSubmitCallback}
              initNodeIdParam={nodeId}
              initNodeLabelParam={nodeLabel}
              initNodeCategoryParam={nodeCategory}
            />
          </Tab>
          : null
        }
        <Tab heading={HOME_QUERY_TAB_HEADING.smart} className={styles.queryTab}>
          <Query
            isResults={isResults}
            initPresetTypeObject={initPresetTypeObject}
            initNodeLabelParam={nodeLabel}
            initNodeIdParam={nodeId}
            initNodeCategoryParam={nodeCategory}
            selectedProject={selectedProject}
            combinedStyles={styles}
            shouldNavigate={shouldNavigate}
            submissionCallback={onSubmitCallback}
          />
        </Tab>
        { isPathfinderEnabled ? 
          <Tab
            heading={HOME_QUERY_TAB_HEADING.pathfinder}
            headingOverride={<BetaTag heading={HOME_QUERY_TAB_HEADING.pathfinder} tagClassName={projectPage ? styles.betaTag : ''} />}
            className={styles.pathfinderTab}>
            <QueryPathfinder
              isResults={isResults}
              selectedProject={selectedProject}
              user={user}
              shouldNavigate={shouldNavigate}
              submissionCallback={onSubmitCallback}
              initNodeIdParam={nodeId}
              initNodeLabelParam={nodeLabel}
              initNodeCategoryParam={nodeCategory}
            />
          </Tab>
          : null
        }
      </Tabs>
    </div>
  );
};

export default CombinedQueryInterface;