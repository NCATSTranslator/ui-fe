import { FC } from 'react';
import styles from './CanvasObjectList.module.scss';
import type { Canvas, CanvasAnnotation, CanvasNode } from '@/features/Canvas/types/canvas';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import type { CanvasAnnotationAction } from '@/features/Canvas/constants/canvasAnnotationActions';
import useCanvasObjectList from '@/features/Canvas/hooks/useCanvasObjectList';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import NodeItem from './NodeItem';
import AnnotationItem from './AnnotationItem';
import ObjectListEmptyState from './ObjectListEmptyState';
import ObjectListControls from './ObjectListControls';
import ObjectListTabs from './ObjectListTabs';
import ObjectListBody from './ObjectListBody';

interface CanvasObjectListProps {
  canvas: Canvas;
  visibleNodes?: Record<string, CanvasNode>;
  onHoverNode: (nodeId: string | null) => void;
  onHoverAnnotation: (annotationId: string | null) => void;
  onFindNode: (nodeId: string) => void;
  onFindAnnotation: (annotationId: string) => void;
  onAnnotationAction?: (action: CanvasAnnotationAction, annotation: CanvasAnnotation) => void;
  onAddObject?: () => void;
  onAddAnnotation?: () => void;
  onNodeMenu: (nodeId: string, position: { x: number; y: number }) => void;
  onCloseNodeMenus?: () => void;
}

const CanvasObjectList: FC<CanvasObjectListProps> = ({
  canvas,
  visibleNodes,
  onHoverNode,
  onHoverAnnotation,
  onFindNode,
  onFindAnnotation,
  onAnnotationAction,
  onAddObject,
  onAddAnnotation,
  onNodeMenu,
  onCloseNodeMenus,
}) => {
  const {
    collapsed,
    toggleCollapse,
    activeTab,
    setActiveTab,
    inputValue,
    searchTerm,
    handleSearch,
    sortDropdownOpen,
    toggleSortDropdown,
    closeSortDropdown,
    activeSortKey,
    currentSortLabel,
    handleSortSelect,
    searchPlaceholder,
    allNodes,
    allAnnotations,
    sortedNodes,
    sortedAnnotations,
    annotationMenuId,
    handleNodeClick,
    handleAnnotationClick,
    handleNodeMenu,
    handleMenuToggle,
    handleAnnotationMenuAction,
    handleCloseMenu,
  } = useCanvasObjectList({
    canvas,
    visibleNodes,
    onFindNode,
    onFindAnnotation,
    onAnnotationAction,
    onNodeMenu,
    onCloseNodeMenus,
  });

  return (
    <div className={joinClasses(styles.objectList, collapsed && styles.collapsed)}>
      <button
        type="button"
        className={styles.collapseToggle}
        onClick={toggleCollapse}
        aria-label={collapsed ? 'Expand object list' : 'Collapse object list'}
      >
        <span className={styles.collapseLabel}>On this Canvas ({allNodes.length})</span>
        <ChevDown />
      </button>
      {
        !collapsed && (
          <div className={styles.contentWrapper}>
            <ObjectListControls
              activeTab={activeTab}
              searchInputValue={inputValue}
              searchPlaceholder={searchPlaceholder}
              onSearch={handleSearch}
              sortLabel={currentSortLabel}
              sortDropdownOpen={sortDropdownOpen}
              onSortDropdownToggle={toggleSortDropdown}
              onSortDropdownClose={closeSortDropdown}
              activeSortKey={activeSortKey}
              onSortSelect={handleSortSelect}
            />

            <div className={styles.listBody}>
              {activeTab === 'objects' && (
                <>
                  <ObjectListEmptyState
                    entityLabel="objects"
                    allCount={allNodes.length}
                    filteredCount={sortedNodes.length}
                    searchTerm={searchTerm}
                    onAdd={onAddObject}
                    addLabel="Add Object"
                  />
                  {sortedNodes.length > 0 && (
                    <div className={styles.nodeList}>
                      {sortedNodes.map(node => (
                        <NodeItem
                          key={node.id}
                          node={node}
                          searchTerm={searchTerm}
                          onNodeClick={node => handleNodeClick(node.id)}
                          onHoverNode={onHoverNode}
                          onMenu={handleNodeMenu}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'annotations' && (
                <>
                  <ObjectListEmptyState
                    entityLabel="annotations"
                    allCount={allAnnotations.length}
                    filteredCount={sortedAnnotations.length}
                    searchTerm={searchTerm}
                    onAdd={onAddAnnotation}
                    addLabel="Add Annotation"
                  />
                  {sortedAnnotations.length > 0 && (
                    <ObjectListBody menuId={annotationMenuId} onCloseMenu={handleCloseMenu}>
                      {sortedAnnotations.map(annotation => (
                        <AnnotationItem
                          key={annotation.id}
                          annotation={annotation}
                          searchTerm={searchTerm}
                          menuId={annotationMenuId}
                          onAnnotationClick={item => handleAnnotationClick(item.id)}
                          onHoverAnnotation={onHoverAnnotation}
                          onMenuToggle={handleMenuToggle}
                          onMenuAction={handleAnnotationMenuAction}
                        />
                      ))}
                    </ObjectListBody>
                  )}
                </>
              )}
            </div>

            <ObjectListTabs
              activeTab={activeTab}
              objectCount={allNodes.length}
              annotationCount={allAnnotations.length}
              onTabChange={setActiveTab}
            />
          </div>
        )
      }
    </div>
  );
};

export default CanvasObjectList;
