import { FC, useState, useMemo, useCallback, MouseEvent } from 'react';
import styles from './CanvasObjectList.module.scss';
import type { Canvas, CanvasNode } from '@/features/Canvas/types/canvas';
import { useSimpleSearch } from '@/features/Core/hooks/simpleSearchHook';
import { ObjectSortMode, sortCanvasNodes, filterCanvasNodes, getNodeEdgeCount } from '@/features/Canvas/utils/canvasFunctions';
import { formatBiolinkEntity } from '@/features/Core/utils/stringFormatters';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import CanvasNodeActionMenu from '@/features/Canvas/components/CanvasNodeActionMenu/CanvasNodeActionMenu';
import {
  OBJECT_LIST_NODE_ACTIONS,
  type CanvasNodeAction,
} from '@/features/Canvas/constants/canvasNodeActions';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import Button from '@/features/Core/components/Button/Button';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';

type Tab = 'objects' | 'annotations';

const SORT_OPTIONS: { key: ObjectSortMode; label: string }[] = [
  { key: 'relationships', label: '# of Relationships' },
  { key: 'alphabetical', label: 'Alphabetical' },
  { key: 'type', label: 'Type' },
];

interface NodeItemProps {
  node: CanvasNode;
  canvas: Canvas;
  nodeMenuId: string | null;
  onNodeClick: (node: CanvasNode) => void;
  onHoverNode: (nodeId: string | null) => void;
  onMenuToggle: (nodeId: string, e: MouseEvent) => void;
  onMenuAction: (action: CanvasNodeAction, node: CanvasNode) => void;
}

const NodeItem: FC<NodeItemProps> = ({ node, canvas, nodeMenuId, onNodeClick, onHoverNode, onMenuToggle, onMenuAction }) => {
  const edgeCount = getNodeEdgeCount(canvas, node.id);
  const typeLabel = node.types[0] ? formatBiolinkEntity(node.types[0]) : '';
  const isMenuOpen = nodeMenuId === node.id;

  return (
    <div
      className={styles.nodeItem}
      onMouseEnter={() => onHoverNode(node.id)}
      onMouseLeave={() => onHoverNode(null)}
    >
      <button
        type="button"
        className={styles.nodeItemContent}
        onClick={() => onNodeClick(node)}
      >
        <span className={styles.nodeName}>{node.names[0] || node.id}</span>
        <span className={styles.nodeMeta}>
          {typeLabel && <span className={styles.typeChip}>{typeLabel}</span>}
          {edgeCount > 0 && (
            <span className={styles.edgeCount}>
              {edgeCount} {edgeCount === 1 ? 'relationship' : 'relationships'}
            </span>
          )}
        </span>
      </button>
      <div className={styles.nodeMenuWrapper}>
        <button
          type="button"
          className={joinClasses(styles.nodeMenuButton, isMenuOpen && styles.active)}
          onClick={e => onMenuToggle(node.id, e)}
          aria-label={`Actions for ${node.names[0] || node.id}`}
        >
          <AddIcon />
        </button>
        {isMenuOpen && (
          <CanvasNodeActionMenu
            actions={OBJECT_LIST_NODE_ACTIONS}
            onAction={action => onMenuAction(action, node)}
            className={styles.nodeMenu}
            itemClassName={styles.nodeMenuItem}
          />
        )}
      </div>
    </div>
  );
};

const AnnotationsTab: FC<{ annotations: Canvas['annotations']; onAddAnnotation?: () => void }> = ({ annotations, onAddAnnotation }) => {
  if (annotations.length === 0) {
    return (
      <div className={styles.emptyState}>
        {onAddAnnotation && (
          <Button handleClick={onAddAnnotation} smallFont iconLeft={<AddIcon />}>
            Add Annotation
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.nodeList}>
      {annotations.map(annotation => (
        <div key={annotation.id} className={styles.annotationItem}>
          <span className={styles.annotationText}>{annotation.text}</span>
        </div>
      ))}
    </div>
  );
};

const renderObjectsEmptyState = (
  allNodes: CanvasNode[],
  sortedNodes: CanvasNode[],
  searchTerm: string,
  onAddObject?: () => void,
) => {
  if (allNodes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No objects on this canvas yet.</p>
        {onAddObject && (
          <button type="button" className={styles.emptyAction} onClick={onAddObject}>
            Add Object
          </button>
        )}
      </div>
    );
  }
  if (sortedNodes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No matching objects.</p>
        {onAddObject && (
          <button type="button" className={styles.emptyAction} onClick={onAddObject}>
            Add &ldquo;{searchTerm}&rdquo;
          </button>
        )}
      </div>
    );
  }
  return null;
};

interface CanvasObjectListProps {
  canvas: Canvas;
  visibleNodes?: Record<string, CanvasNode>;
  onHoverNode: (nodeId: string | null) => void;
  onFindNode: (nodeId: string) => void;
  onAction?: (action: CanvasNodeAction, node: CanvasNode) => void;
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
  onAddObject,
  onAddAnnotation,
  nodeMenuId,
  onNodeMenuIdChange,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('objects');
  const { searchTerm, handleSearch } = useSimpleSearch();
  const [sortMode, setSortMode] = useState<ObjectSortMode>('relationships');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const allNodes = useMemo(
    () => Object.values(visibleNodes ?? canvas.nodes),
    [visibleNodes, canvas.nodes]
  );
  const annotationCount = canvas.annotations.length;

  const filteredNodes = useMemo(
    () => filterCanvasNodes(allNodes, searchTerm),
    [allNodes, searchTerm]
  );

  const sortedNodes = useMemo(
    () => sortCanvasNodes(filteredNodes, sortMode, canvas),
    [filteredNodes, sortMode, canvas]
  );

  const handleNodeClick = useCallback((node: CanvasNode) => {
    onFindNode(node.id);
  }, [onFindNode]);

  const handleNodeMenuToggle = useCallback((nodeId: string, e: MouseEvent) => {
    e.stopPropagation();
    onNodeMenuIdChange(nodeMenuId === nodeId ? null : nodeId);
  }, [nodeMenuId, onNodeMenuIdChange]);

  const handleNodeMenuAction = useCallback((action: CanvasNodeAction, node: CanvasNode) => {
    onNodeMenuIdChange(null);
    onAction?.(action, node);
  }, [onAction, onNodeMenuIdChange]);

  const handleCloseNodeMenu = useCallback(() => onNodeMenuIdChange(null), [onNodeMenuIdChange]);

  const toggleCollapse = useCallback(() => setCollapsed(prev => !prev), []);

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortMode)?.label ?? '';

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
            {activeTab === 'objects' && (
              <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                  <SearchIcon className={styles.searchIcon} />
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search objects..."
                    onChange={e => handleSearch(e.target.value)}
                  />
                </div>
                <OutsideClickHandler onOutsideClick={() => setSortDropdownOpen(false)}>
                  <div className={styles.sortWrapper}>
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => setSortDropdownOpen(prev => !prev)}
                    >
                      Sort: {currentSortLabel}
                    </button>
                    {sortDropdownOpen && (
                      <div className={styles.sortDropdown}>
                        {SORT_OPTIONS.map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            className={joinClasses(styles.sortOption, sortMode === key && styles.activeSortOption)}
                            onClick={() => { setSortMode(key); setSortDropdownOpen(false); }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </OutsideClickHandler>
              </div>
            )}

            <div className={styles.listBody}>
              {activeTab === 'objects' && (
                renderObjectsEmptyState(allNodes, sortedNodes, searchTerm, onAddObject) || (
                  <OutsideClickHandler
                    className={styles.listBodyClickTarget}
                    onOutsideClick={() => { if (nodeMenuId) handleCloseNodeMenu(); }}
                  >
                    <div className={styles.nodeList}>
                      {sortedNodes.map(node => (
                        <NodeItem
                          key={node.id}
                          node={node}
                          canvas={canvas}
                          nodeMenuId={nodeMenuId}
                          onNodeClick={handleNodeClick}
                          onHoverNode={onHoverNode}
                          onMenuToggle={handleNodeMenuToggle}
                          onMenuAction={handleNodeMenuAction}
                        />
                      ))}
                    </div>
                  </OutsideClickHandler>
                )
              )}

              {activeTab === 'annotations' && (
                <AnnotationsTab annotations={canvas.annotations} onAddAnnotation={onAddAnnotation} />
              )}
            </div>

            <div className={styles.tabs}>
              <button
                type="button"
                className={joinClasses(styles.tab, activeTab === 'objects' && styles.activeTab)}
                onClick={() => setActiveTab('objects')}
              >
                Objects ({allNodes.length})
              </button>
              <button
                type="button"
                className={joinClasses(styles.tab, activeTab === 'annotations' && styles.activeTab)}
                onClick={() => setActiveTab('annotations')}
              >
                Annotations ({annotationCount})
              </button>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default CanvasObjectList;
