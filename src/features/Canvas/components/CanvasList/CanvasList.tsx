import { useEffect } from 'react';
import styles from './CanvasList.module.scss';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { currentUser } from '@/features/UserAuth/slices/userSlice';
import ListHeader from '@/features/Core/components/ListHeader/ListHeader';
import Button from '@/features/Core/components/Button/Button';
import Plus from '@/assets/icons/buttons/Add/Add.svg?react';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import WorkspaceIcon from '@/assets/icons/navigation/Workspace.svg?react';
import EmptyArea from '@/features/Projects/components/EmptyArea/EmptyArea';
import { getFormattedLoginURL } from '@/features/UserAuth/utils/userApi';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';
import { getTimeRelativeDate } from '@/features/Core/utils/dateHelpers';
import SidebarCard from '@/features/Sidebar/components/SidebarCard/SidebarCard';
import useCanvasList from '@/features/Canvas/hooks/useCanvasList';
import { getCanvasNodeCount } from '@/features/Canvas/utils/canvasFunctions';

const EmptyCanvasList = ({ searchTerm, onCreateCanvas }: { searchTerm: string; onCreateCanvas: () => void }) => {
  if (searchTerm) {
    return (
      <EmptyArea>
        <p>No canvases found matching your search.</p>
      </EmptyArea>
    );
  }
  return (
    <EmptyArea heading="No Canvases">
      <p>
        <Button handleClick={onCreateCanvas} title="Create New Canvas" variant="textOnly" inline>Create a canvas</Button> to start building knowledge graphs from your query results.
      </p>
    </EmptyArea>
  );
};

const CanvasList = () => {
  const location = useLocation();
  const user = useSelector(currentUser);
  const { activePanelId, closePanel } = useSidebar();
  const {
    canvases,
    sortedFilteredCanvases,
    activeCanvasId,
    searchTerm,
    handleSearch,
    renamingId,
    renameInputRef,
    setRenameValue,
    handleCreateCanvas,
    handleSelectCanvas,
    handleStartRename,
    handleSubmitRename,
    handleDeleteCanvas,
  } = useCanvasList();

  useEffect(() => {
    if (activePanelId === 'canvases') closePanel();
  }, [activePanelId, closePanel]);

  const shouldShowErrorState = !user?.id && canvases.length === 0;

  return (
    <div className={styles.canvasesPage}>
      <ListHeader
        heading="Canvases"
        searchPlaceholder="Search Canvases"
        searchTerm={searchTerm}
        handleSearch={handleSearch}
      />
      <div className={styles.list}>
        {shouldShowErrorState ? (
          <EmptyArea>
            <p>
              <a href={getFormattedLoginURL(location)} className={styles.link}>Log in</a> to view your canvases.
            </p>
          </EmptyArea>
        ) : (
          <div className={styles.canvasList}>
            <Button
              iconLeft={<Plus />}
              handleClick={handleCreateCanvas}
              title="Create New Canvas"
              className={styles.createButton}
              variant="textOnly"
            >
              Create New Canvas
            </Button>
            <div className={styles.canvasCount}>
              {sortedFilteredCanvases.length} {sortedFilteredCanvases.length === 1 ? 'Canvas' : 'Canvases'}
            </div>
            <div className={styles.cards}>
              {sortedFilteredCanvases.length === 0 ? (
                <EmptyCanvasList searchTerm={searchTerm} onCreateCanvas={handleCreateCanvas} />
              ) : (
                sortedFilteredCanvases.map(canvas => {
                  const nodeCount = getCanvasNodeCount(canvas);
                  const isActive = canvas.id === activeCanvasId;
                  const isRenaming = canvas.id === renamingId;
                  const updatedTime = getTimeRelativeDate(new Date(canvas.timeUpdated));

                  const options = (
                    <>
                      <Button handleClick={() => handleStartRename(canvas)} iconLeft={<EditIcon />}>Rename</Button>
                      <Button handleClick={() => handleDeleteCanvas(canvas.id)} iconLeft={<TrashIcon />}>Delete</Button>
                    </>
                  );

                  return (
                    <SidebarCard
                      key={canvas.id}
                      className={isActive ? styles.activeCanvas : ''}
                      leftIcon={<WorkspaceIcon />}
                      title={canvas.title}
                      searchTerm={searchTerm}
                      onClick={() => handleSelectCanvas(canvas)}
                      bottomLeft={
                        <span className={styles.meta}>
                          {nodeCount} {nodeCount === 1 ? 'object' : 'objects'} · {canvas.annotations.length} {canvas.annotations.length === 1 ? 'note' : 'notes'}
                        </span>
                      }
                      bottomRight={<span className={styles.meta}>{updatedTime}</span>}
                      options={options}
                      isRenaming={isRenaming}
                      onTitleChange={setRenameValue}
                      onFormSubmit={handleSubmitRename}
                      textInputRef={renameInputRef}
                    />
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasList;
