import { FC, useState } from 'react';
import styles from './CanvasSidebarPanel.module.scss';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import SidebarCard from '@/features/Sidebar/components/SidebarCard/SidebarCard';
import Button from '@/features/Core/components/Button/Button';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import WorkspaceIcon from '@/assets/icons/navigation/Workspace.svg?react';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import SwapIcon from '@/assets/icons/buttons/Swap.svg?react';
import useCanvasList from '@/features/Canvas/hooks/useCanvasList';
import { getCanvasNodeCount, CanvasSortMode } from '@/features/Canvas/utils/canvasFunctions';

const CanvasSidebarPanel: FC = () => {
  const [sortMode, setSortMode] = useState<CanvasSortMode>('date');
  const {
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
  } = useCanvasList(sortMode);

  const toggleSort = () => {
    setSortMode(prev => prev === 'date' ? 'name' : 'date');
  };

  return (
    <div className={styles.canvasesPanel}>
      <div className={styles.top}>
        <div className={styles.searchRow}>
          <TextInput
            iconLeft={<SearchIcon />}
            iconRight={searchTerm.length > 0 && <CloseIcon />}
            iconRightClickToReset
            handleChange={handleSearch}
            placeholder="Search Canvases"
            className={styles.searchInput}
          />
          <button
            className={styles.sortToggle}
            onClick={toggleSort}
            title={`Sort by ${sortMode === 'date' ? 'name' : 'date'}`}
          >
            <SwapIcon />
          </button>
        </div>
        <Button 
          iconLeft={<AddIcon />}
          handleClick={handleCreateCanvas}
          title="Create New Canvas"
          className={styles.createButton}
        >
          Create New Canvas
        </Button>
      </div>
      <div className={styles.list}>
        {sortedFilteredCanvases.length === 0 ? (
          <div className={styles.empty}>
            {searchTerm ? (
              <p>No canvases match your search.</p>
            ) : (
              <p>No canvases yet. Create one to get started.</p>
            )}
          </div>
        ) : (
          sortedFilteredCanvases.map(canvas => {
            const nodeCount = getCanvasNodeCount(canvas);
            const isActive = canvas.id === activeCanvasId;
            const isRenaming = canvas.id === renamingId;

            const bottomLeft = (
              <span className={styles.count}>
                {nodeCount} {nodeCount === 1 ? 'Object' : 'Objects'}
              </span>
            );
            const bottomRight = (
              <span className={styles.count}>
                {canvas.annotations.length} {canvas.annotations.length === 1 ? 'Annotation' : 'Annotations'}
              </span>
            );
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
                bottomLeft={bottomLeft}
                bottomRight={bottomRight}
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
  );
};

export default CanvasSidebarPanel;
