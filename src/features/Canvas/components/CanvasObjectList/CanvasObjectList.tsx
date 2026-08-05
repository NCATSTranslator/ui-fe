import { FC } from 'react';
import styles from './CanvasObjectList.module.scss';
import type { Canvas, CanvasAnnotation, CanvasNode } from '@/features/Canvas/types/canvas';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import type { CanvasNodeAction } from '@/features/Canvas/constants/canvasNodeActions';
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
  onFindNode: (nodeId: string) => void;
  onAction?: (action: CanvasNodeAction, node: CanvasNode) => void;
  onAnnotationAction?: (action: CanvasAnnotationAction, annotation: CanvasAnnotation) => void;
  onAddObject?: () => void;
  onAddAnnotation?: () => void;
  nodeMenuId: string | null;
  onNodeMenuIdChange: (nodeId: string | null) => void;
}

const CanvasObjectList: FC<CanvasObjectListProps> = ({
  canvas,
  visibleNodes,
  onHoverNode,
  onFindNode,
  onAction,
  onAnnotationAction,
  onAddObject,
  onAddAnnotation,
  nodeMenuId,
  onNodeMenuIdChange,
}) => {
  const {
    collapsed,
    toggleCollapse,
    activeTab,
    setActiveTab,
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
    handleItemClick,
    handleMenuToggle,
    handleNodeMenuAction,
    handleAnnotationMenuAction,
    handleCloseMenu,
  } = useCanvasObjectList({
    canvas,
    visibleNodes,
    onFindNode,
    onAction,
    onAnnotationAction,
    nodeMenuId,
    onNodeMenuIdChange,
  });

  return (
    <div className={joinClasses(styles.objectList, collapsed && styles.collapsed)}>
      <button
        type="button"
        className={styles.collapseToggle}
        onClick={toggleCollapse}
        aria-label={collapsed ? 'Expand object list' : 'Collapse object list'}
      >
        <span className={styles.collapseLabel}>On this Canvas</span>
        <ChevDown />
      </button>
      {
        !collapsed && (
          <div className={styles.contentWrapper}>
            <ObjectListControls
              activeTab={activeTab}
              searchTerm={searchTerm}
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
                    <ObjectListBody menuId={nodeMenuId} onCloseMenu={handleCloseMenu}>
                      {sortedNodes.map(node => (
                        <NodeItem
                          key={node.id}
                          node={node}
                          canvas={canvas}
                          nodeMenuId={nodeMenuId}
                          onNodeClick={node => handleItemClick(node.id)}
                          onHoverNode={onHoverNode}
                          onMenuToggle={handleMenuToggle}
                          onMenuAction={handleNodeMenuAction}
                        />
                      ))}
                    </ObjectListBody>
                  )}
                </>
              )}

              {activeTab === 'annotations' && (
                <>
                  <ObjectListEmptyState
                    entityLabel="annotations"
                    allCount={allAnnotations.length}
                    filteredCount={sortedAnnotations.length}
                    onAdd={onAddAnnotation}
                    addLabel="Add Annotation"
                  />
                  {sortedAnnotations.length > 0 && (
                    <ObjectListBody menuId={nodeMenuId} onCloseMenu={handleCloseMenu}>
                      {sortedAnnotations.map(annotation => (
                        <AnnotationItem
                          key={annotation.id}
                          annotation={annotation}
                          menuId={nodeMenuId}
                          onAnnotationClick={item => handleItemClick(item.id)}
                          onHoverAnnotation={onHoverNode}
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
