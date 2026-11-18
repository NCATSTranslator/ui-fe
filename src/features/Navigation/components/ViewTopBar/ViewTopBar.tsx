import { FC, ReactNode, useId, useMemo } from 'react';
import styles from './ViewTopBar.module.scss';
import Breadcrumbs from '@/features/Navigation/components/Breadcrumbs/Breadcrumbs';
import Button from '@/features/Core/components/Button/Button';
import DividerVert from '@/features/Core/components/DividerVert/DividerVert';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
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

interface ViewTopBarProps {
  /** Previous/next control for the view, rendered first and set apart from the other buttons by a rule. */
  stepper?: ReactNode;
  /** View-specific actions, rendered to the left of the share button. */
  actions?: ReactNode;
}

const ViewTopBar: FC<ViewTopBarProps> = ({ stepper, actions }) => {
  const resultListContext = useOptionalResultListContext();
  // Generated because a hidden view can keep its own top bar mounted beside the visible one.
  const shareTooltipId = useId();

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
      {(resultListContext || stepper || actions) && (
        <div className={styles.buttons}>
          {
            resultListContext && showAddToProjectButton &&
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
          {stepper}
          {stepper && (actions || resultListContext) && <DividerVert className={styles.rule} />}
          {actions}
          {resultListContext && (
            <>
              <Button
                variant="secondary"
                handleClick={() => resultListContext.setShareModalOpen(true)}
                className={styles.shareButton}
                ariaLabel="Share"
                dataTooltipId={shareTooltipId}
                small
                iconLeft={<ShareIcon/>}
                iconOnly
              />
              <Tooltip id={shareTooltipId}>
                <span>Share a link to this view</span>
              </Tooltip>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewTopBar;
