import { FC, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './CanvasPanel.module.scss';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import Button from '@/features/Core/components/Button/Button';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import SwapIcon from '@/assets/icons/buttons/Swap.svg?react';
import CanvasSidebarCard from '@/features/Canvas/components/CanvasSidebarCard/CanvasSidebarCard';
import useCanvasList from '@/features/Canvas/hooks/useCanvasList';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';
import { useUser, getFormattedLoginURL } from '@/features/UserAuth/utils/userApi';
import { CanvasSortMode } from '@/features/Canvas/utils/canvasFunctions';

const CanvasPanel: FC = () => {
  const [user] = useUser();
  const location = useLocation();
  const [sortMode, setSortMode] = useState<CanvasSortMode>('date');
  const {
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
  } = useCanvasList({ sortMode });
  const { createCanvas } = useCreateCanvas();

  const toggleSort = () => {
    setSortMode(prev => prev === 'date' ? 'name' : 'date');
  };

  if (!user) {
    return (
      <div className={styles.canvasesPanel}>
        <div className={styles.empty}>
          <p>
            <a href={getFormattedLoginURL(location)} className={styles.link}>Log in</a> to view your canvases.
          </p>
        </div>
      </div>
    );
  }

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
          handleClick={createCanvas}
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
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CanvasPanel;
