import { FC, useMemo } from 'react';
import styles from './ResultListTopBar.module.scss';
import Breadcrumbs from '@/features/Navigation/components/Breadcrumbs/Breadcrumbs';
import Button from '@/features/Core/components/Button/Button';
import FolderPlusIcon from '@/assets/icons/projects/folderplus2.svg?react';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import { useUser } from '@/features/UserAuth/utils/userApi';
import { useUserProjects, useUserQueries } from '@/features/Projects/hooks/customHooks';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks'; 
import { useSelector } from 'react-redux';
import { currentConfig } from '@/features/UserAuth/slices/userSlice';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { useMatches } from 'react-router-dom';
import { BreadcrumbHandle } from '@/features/Navigation/types/navigation.d';

const ResultListTopBar: FC = () => {

  const {
    pk,
    setShareModalOpen,
  } = useResultListContext();

  const config = useSelector(currentConfig);
  const [user, userLoading] = useUser();
  const { isLoading: projectsLoading, error: projectsError } = useUserProjects();
  const { data: queries = [], isLoading: queriesLoading, error: queriesError } = useUserQueries();
  const query = useMemo(() => queries.find(q => q.data.qid === pk), [queries, pk]);
  const { activePanelId, setAddToProjectMode, togglePanel } = useSidebar();

  const matches = useMatches();
  const breadCrumbs = matches
    .filter((match) => (match.handle as BreadcrumbHandle)?.breadcrumb)
    .map((match) => ({
      label: (match.handle as BreadcrumbHandle).breadcrumb,
      path: match.pathname,
    }));
  const isBaseView = breadCrumbs.length === 1;

  const handleAddToProject = () => {
    if (!query) return;
    setAddToProjectMode(query);
    if (activePanelId !== 'projects') togglePanel('projects');
  };

  const showAddToProjectButton = !!(isBaseView && config?.include_projects);

  const disableAddToProjectButton = !!(!user || userLoading || projectsLoading || projectsError ||
    queriesLoading || queriesError || !query || query.data.deleted);

  return (
    <div className={styles.resultListTopBar}>
      <Breadcrumbs hideBaseView={false} />
      <div className={styles.buttons}>
        {
          showAddToProjectButton &&
          <Button
            variant="secondary"
            handleClick={handleAddToProject}
            className={styles.addButton}
            small
            iconLeft={<FolderPlusIcon/>}
            disabled={disableAddToProjectButton}
          >
            Project
          </Button>
        }
        <Button variant="secondary" handleClick={() => setShareModalOpen(true)} className={styles.shareButton} small iconLeft={<ShareIcon/>} iconOnly/>
      </div>
    </div>
  );
};

export default ResultListTopBar;