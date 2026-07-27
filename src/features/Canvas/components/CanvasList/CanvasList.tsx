import { useEffect, useMemo } from 'react';
import styles from './CanvasList.module.scss';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { currentUser } from '@/features/UserAuth/slices/userSlice';
import ListHeader from '@/features/Core/components/ListHeader/ListHeader';
import Tab from '@/features/Core/components/Tabs/Tab';
import Tabs from '@/features/Core/components/Tabs/Tabs';
import Button from '@/features/Core/components/Button/Button';
import Plus from '@/assets/icons/buttons/Add/Add.svg?react';
import EmptyArea from '@/features/Projects/components/EmptyArea/EmptyArea';
import CardList from '@/features/Core/components/CardList/CardList';
import { getFormattedLoginURL } from '@/features/UserAuth/utils/userApi';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';
import CanvasSidebarCard from '@/features/Canvas/components/CanvasSidebarCard/CanvasSidebarCard';
import useCanvasList from '@/features/Canvas/hooks/useCanvasList';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';

const EmptyCanvasList = ({ searchTerm, createCanvas }: { searchTerm: string; createCanvas: () => void }) => {
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
        <Button handleClick={createCanvas} title="Create New Canvas" variant="textOnly" inline>Create a canvas</Button> to start building knowledge graphs from your query results.
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
    renameValue,
    renameInputRef,
    setRenameValue,
    handleSelectCanvas,
    handleStartRename,
    handleSubmitRename,
    handleDeleteCanvas,
  } = useCanvasList();
  const { createCanvas } = useCreateCanvas();

  const canvasTabHeading = useMemo(() => {
    const canvasCount = sortedFilteredCanvases.length;
    return `${canvasCount} Canvas${canvasCount === 1 ? '' : 'es'}`;
  }, [sortedFilteredCanvases.length]);

  // on component mount, if the canvases panel is open, close it
  useEffect(() => {
    if (activePanelId === 'canvases') closePanel();
  }, []);

  const shouldShowErrorState = !user?.id && canvases.length === 0;

  return (
    <>
      <ListHeader
        heading="Canvases"
        searchPlaceholder="Search Canvases"
        searchTerm={searchTerm}
        handleSearch={handleSearch}
      />
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
            handleClick={createCanvas}
            title="Create New Canvas"
            className={styles.createButton}
            variant="textOnly"
          >
            Create New Canvas
          </Button>
          <Tabs
            handleTabSelection={() => {}}
            defaultActiveTab={canvasTabHeading}
            activeTab={canvasTabHeading}
            controlled
          >
            {[
              <Tab key="canvases" heading={canvasTabHeading}>
                <CardList>
                  {sortedFilteredCanvases.length === 0 ? (
                    <EmptyCanvasList searchTerm={searchTerm} createCanvas={createCanvas} />
                  ) : (
                    sortedFilteredCanvases.map(canvas => (
                      <CanvasSidebarCard
                        key={canvas.id}
                        canvas={canvas}
                        isActive={canvas.id === activeCanvasId}
                        isRenaming={canvas.id === renamingId}
                        renameValue={renameValue}
                        searchTerm={searchTerm}
                        renameInputRef={renameInputRef}
                        onSelect={handleSelectCanvas}
                        onStartRename={handleStartRename}
                        onDelete={handleDeleteCanvas}
                        onRenameValueChange={setRenameValue}
                        onSubmitRename={handleSubmitRename}
                        showUpdatedTime
                      />
                    ))
                  )}
                </CardList>
              </Tab>,
            ]}
          </Tabs>
        </div>
      )}
    </>
  );
};

export default CanvasList;
