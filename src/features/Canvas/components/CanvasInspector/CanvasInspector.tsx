import { FC } from 'react';
import styles from './CanvasInspector.module.scss';
import type { CanvasInspectorState } from '@/features/Canvas/hooks/useCanvasInspector';
import type {
  InspectorQueryData,
  InspectorResultData,
  InspectorPathData,
  InspectorEvidenceData,
  InspectorNodeData,
} from '@/features/Canvas/types/canvas';
import type { CanvasInspectorFiltersState } from '@/features/Canvas/hooks/useCanvasInspectorFilters';
import InspectorQueryView from './views/InspectorQueryView';
import InspectorResultView from './views/InspectorResultView';
import InspectorPathView from './views/InspectorPathView';
import InspectorNodeView from './views/InspectorNodeView';
import InspectorEvidenceView from './views/InspectorEvidenceView';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import ChevLeft from '@/assets/icons/directional/Chevron/Chevron Left.svg?react';

export interface InspectorAddToGraphHandlers {
  onAddResult: (queryPk: string, resultId: string) => void;
  onAddPath: (queryPk: string, pathId: string) => void;
  onAddQueryResults: (queryPk: string) => void;
  onAddNode: (queryPk: string, nodeId: string) => void;
  onAddEdge: (queryPk: string, edgeId: string) => void;
}

const buildAddHandler = (
  handlers: InspectorAddToGraphHandlers | undefined,
  action: (h: InspectorAddToGraphHandlers) => void,
): (() => void) | undefined =>
  handlers ? () => action(handlers) : undefined;

const buildNodeAddHandler = (
  handlers: InspectorAddToGraphHandlers | undefined,
  queryPk: string | undefined,
  nodeId: string,
): (() => void) | undefined => {
  if (!handlers || !queryPk) return undefined;
  return () => handlers.onAddNode(queryPk, nodeId);
};

interface CanvasInspectorProps {
  inspector: CanvasInspectorState;
  addToGraphHandlers?: InspectorAddToGraphHandlers;
  inspectorFilters?: CanvasInspectorFiltersState;
}

const CanvasInspector: FC<CanvasInspectorProps> = ({ inspector, addToGraphHandlers, inspectorFilters }) => {
  const { stack, currentView, goBack, popTo, reset } = inspector;

  if (!currentView) return null;

  const renderView = () => {
    const h = addToGraphHandlers;
    switch (currentView.level) {
      case 'query': {
        const qData = currentView.data as InspectorQueryData;
        return (
          <InspectorQueryView
            data={qData}
            inspector={inspector}
            onAddAllToGraph={buildAddHandler(h, x => x.onAddQueryResults(qData.queryPk))}
          />
        );
      }
      case 'result': {
        const rData = currentView.data as InspectorResultData;
        return (
          <InspectorResultView
            data={rData}
            inspector={inspector}
            inspectorFilters={inspectorFilters}
            onAddToGraph={buildAddHandler(h, x => x.onAddResult(rData.queryPk, rData.resultId))}
          />
        );
      }
      case 'path': {
        const pData = currentView.data as InspectorPathData;
        return (
          <InspectorPathView
            data={pData}
            inspector={inspector}
            onAddToGraph={buildAddHandler(h, x => x.onAddPath(pData.queryPk, pData.pathId))}
          />
        );
      }
      case 'evidence': {
        const eData = currentView.data as InspectorEvidenceData;
        return (
          <InspectorEvidenceView
            data={eData}
            onAddToGraph={buildAddHandler(h, x => x.onAddEdge(eData.queryPk, eData.edgeId))}
          />
        );
      }
      case 'node': {
        const nData = currentView.data as InspectorNodeData;
        return (
          <InspectorNodeView
            data={nData}
            onAddToGraph={buildNodeAddHandler(h, nData.queryPk, nData.nodeId)}
          />
        );
      }
      default:
        return <div className={styles.emptyState}>Unknown view type.</div>;
    }
  };

  return (
    <div className={styles.inspector}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {stack.length > 1 && (
            <button className={styles.backButton} onClick={goBack} aria-label="Go back">
              <ChevLeft />
            </button>
          )}
          <div className={styles.breadcrumbs}>
            {stack.map((crumb, i) => {
              const isLast = i === stack.length - 1;
              return (
                <span key={`${crumb.id}-${i}`} className={styles.breadcrumbItem}>
                  {i > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                  {isLast ? (
                    <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
                  ) : (
                    <button
                      className={styles.breadcrumbLink}
                      onClick={() => popTo(i)}
                    >
                      {crumb.label}
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
        <button className={styles.closeButton} onClick={reset} aria-label="Close inspector">
          <CloseIcon />
        </button>
      </div>
      <div className={styles.content}>
        {renderView()}
      </div>
    </div>
  );
};

export default CanvasInspector;
