import { FC, useMemo } from 'react';
import styles from './ViewTopBar.module.scss';
import Breadcrumbs from '@/features/Navigation/components/Breadcrumbs/Breadcrumbs';
import Button from '@/features/Core/components/Button/Button';
import FolderPlusIcon from '@/assets/icons/projects/folderplus2.svg?react';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import { useUser } from '@/features/UserAuth/utils/userApi';
import { useUserProjects, useUserQueries } from '@/features/Projects/hooks/customHooks';
import useAddToProject from '@/features/Projects/hooks/useAddToProject';
import { useSelector } from 'react-redux';
import { currentConfig } from '@/features/UserAuth/slices/userSlice';
import { useOptionalResultListContext } from '@/features/ResultList/context/ResultListContext';
import { useMatches } from 'react-router-dom';
import { BreadcrumbHandle } from '@/features/Navigation/types/navigation.d';

const ViewTopBar: FC = () => {
  const resultListContext = useOptionalResultListContext();

  const config = useSelector(currentConfig);
  const [user, userLoading] = useUser();
  const { isLoading: projectsLoading, error: projectsError } = useUserProjects();
  const { data: queries = [], isLoading: queriesLoading, error: queriesError } = useUserQueries();
  const pk = resultListContext?.pk ?? null;
  const query = useMemo(() => queries.find(q => q.data.qid === pk), [queries, pk]);
  const { addToProject } = useAddToProject();

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
    addToProject(query);
  };

  const showAddToProjectButton = !!(isBaseView && config?.include_projects);

  const disableAddToProjectButton = !!(!user || userLoading || projectsLoading || projectsError ||
    queriesLoading || queriesError || !query || query.data.deleted);

  return (
    <div className={styles.viewTopBar}>
      <Breadcrumbs hideBaseView={false} />
      {resultListContext && (
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
          <Button variant="secondary" handleClick={() => resultListContext.setShareModalOpen(true)} className={styles.shareButton} small iconLeft={<ShareIcon/>} iconOnly/>
        </div>
      )}
    </div>
  );
};

export default ViewTopBar;
