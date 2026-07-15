import { FC, useState, useMemo, useCallback, useRef, MouseEvent } from 'react';
import styles from './CanvasObjectList.module.scss';
import type { Canvas, CanvasNode } from '@/features/Canvas/types/canvas';
import type { CanvasInspectorState } from '@/features/Canvas/hooks/useCanvasInspector';
import { useSimpleSearch } from '@/features/Core/hooks/simpleSearchHook';
import { ObjectSortMode, sortCanvasNodes, filterCanvasNodes, getNodeEdgeCount } from '@/features/Canvas/utils/canvasFunctions';
import { formatBiolinkEntity } from '@/features/Core/utils/stringFormatters';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import ChevRight from '@/assets/icons/directional/Chevron/Chevron Right.svg?react';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import CircleAddIcon from '@/assets/icons/buttons/Add/Circle Add.svg?react';

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
  onMenuAction: (action: string, node: CanvasNode) => void;
  onCloseMenu: () => void;
}

const NodeItem: FC<NodeItemProps> = ({ node, canvas, nodeMenuId, onNodeClick, onHoverNode, onMenuToggle, onMenuAction, onCloseMenu }) => {
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
      <OutsideClickHandler onOutsideClick={() => { if (isMenuOpen) onCloseMenu(); }}>
        <div className={styles.nodeMenuWrapper}>
          <button
            className={joinClasses(styles.nodeMenuButton, isMenuOpen && styles.active)}
            onClick={e => onMenuToggle(node.id, e)}
            aria-label={`Actions for ${node.names[0] || node.id}`}
          >
            <CircleAddIcon />
          </button>
          {isMenuOpen && (
            <div className={styles.nodeMenu}>
              <button className={styles.nodeMenuItem} onClick={() => onMenuAction('newQuery', node)}>
                New Query
              </button>
              <button className={styles.nodeMenuItem} onClick={() => onMenuAction('information', node)}>
                Information
              </button>
              <button className={styles.nodeMenuItem} onClick={() => onMenuAction('find', node)}>
                Find on Canvas
              </button>
            </div>
          )}
        </div>
      </OutsideClickHandler>
    </div>
  );
};

const AnnotationsTab: FC<{ annotations: Canvas['annotations']; onAddAnnotation?: () => void }> = ({ annotations, onAddAnnotation }) => (
  <>
    {annotations.length === 0 ? (
      <div className={styles.emptyState}>
        <p>No annotations on this canvas yet.</p>
        {onAddAnnotation && (
          <button className={styles.emptyAction} onClick={onAddAnnotation}>
            Add Annotation
          </button>
        )}
      </div>
    ) : (
      <div className={styles.nodeList}>
        {annotations.map(annotation => (
          <div key={annotation.id} className={styles.annotationItem}>
            <span className={styles.annotationText}>{annotation.text}</span>
          </div>
        ))}
      </div>
    )}
  </>
);

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
          <button className={styles.emptyAction} onClick={onAddObject}>
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
          <button className={styles.emptyAction} onClick={onAddObject}>
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
  inspector: CanvasInspectorState;
  onHoverNode: (nodeId: string | null) => void;
  onSelectNode: (nodeId: string) => void;
  onNewQuery?: (node: CanvasNode) => void;
  onAddObject?: () => void;
  onAddAnnotation?: () => void;
}

const CanvasObjectList: FC<CanvasObjectListProps> = ({
  canvas,
  visibleNodes,
  inspector,
  onHoverNode,
  onSelectNode,
  onNewQuery,
  onAddObject,
  onAddAnnotation,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('objects');
  const { searchTerm, handleSearch } = useSimpleSearch();
  const [sortMode, setSortMode] = useState<ObjectSortMode>('relationships');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [nodeMenuId, setNodeMenuId] = useState<string | null>(null);
  const nodeMenuRef = useRef<string | null>(null);

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
    onSelectNode(node.id);
    inspector.openView('node', node.names[0] || node.id, node.id, { nodeId: node.id });
  }, [onSelectNode, inspector]);

  const handleNodeMenuToggle = useCallback((nodeId: string, e: MouseEvent) => {
    e.stopPropagation();
    setNodeMenuId(prev => prev === nodeId ? null : nodeId);
    nodeMenuRef.current = nodeId;
  }, []);

  const handleNodeMenuAction = useCallback((action: string, node: CanvasNode) => {
    setNodeMenuId(null);
    switch (action) {
      case 'newQuery':
        onNewQuery?.(node);
        break;
      case 'information':
        inspector.openView('node', node.names[0] || node.id, node.id, { nodeId: node.id });
        break;
      case 'find':
        onSelectNode(node.id);
        onHoverNode(node.id);
        break;
    }
  }, [inspector, onSelectNode, onHoverNode, onNewQuery]);

  const handleCloseMenu = useCallback(() => setNodeMenuId(null), []);

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortMode)?.label ?? '';

  if (collapsed) {
    return (
      <div className={styles.collapsed}>
        <button
          className={styles.collapseToggle}
          onClick={() => setCollapsed(false)}
          aria-label="Expand object list"
        >
          <span className={styles.collapseLabel}>On this Canvas</span>
          <ChevRight />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.objectList}>
      <div className={styles.header}>
        <button
          className={styles.collapseButton}
          onClick={() => setCollapsed(true)}
          aria-label="Collapse object list"
        >
          <span className={joinClasses(styles.chevron, styles.expanded)}>
            <ChevRight />
          </span>
          <span className={styles.headerTitle}>On this Canvas</span>
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={joinClasses(styles.tab, activeTab === 'objects' && styles.activeTab)}
          onClick={() => setActiveTab('objects')}
        >
          Objects ({allNodes.length})
        </button>
        <button
          className={joinClasses(styles.tab, activeTab === 'annotations' && styles.activeTab)}
          onClick={() => setActiveTab('annotations')}
        >
          Annotations ({annotationCount})
        </button>
      </div>

      {activeTab === 'objects' && (
        <>
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

          {renderObjectsEmptyState(allNodes, sortedNodes, searchTerm, onAddObject) || (
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
                  onCloseMenu={handleCloseMenu}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'annotations' && (
        <AnnotationsTab annotations={canvas.annotations} onAddAnnotation={onAddAnnotation} />
      )}
    </div>
  );
};

export default CanvasObjectList;
