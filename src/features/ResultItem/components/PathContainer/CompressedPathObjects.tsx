import { FC, Fragment, RefObject } from 'react';
import PathObject from '@/features/ResultItem/components/PathObject/PathObject';
import PathGroupConnectors from '@/features/ResultItem/components/PathContainer/PathGroupConnectors';
import { Path, ResultEdge, ResultNode } from '@/features/ResultList/types/results';
import { EMPTY_STRING_ARRAY } from '@/features/Core/utils/constants';

interface CompressedPathObjectsProps {
  compressedSubgraph: (ResultEdge | ResultNode | ResultEdge[])[];
  path: Path;
  parentPathKey: string;
  pk: string;
  handleEdgeClick?: (edgeIDs: string[], path: Path) => void;
  selectedEdge?: ResultEdge | null;
  selectedEdgeRef?: RefObject<HTMLElement | null>;
  styles: { [key: string]: string };
}

/**
 * Renders a path's compressed subgraph inside the evidence modal. Groups of
 * compressed edges are fanned out between connector lines; single items render
 * as a plain PathObject.
 */
const CompressedPathObjects: FC<CompressedPathObjectsProps> = ({
  compressedSubgraph,
  path,
  parentPathKey,
  pk,
  handleEdgeClick,
  selectedEdge,
  selectedEdgeRef,
  styles,
}) => (
  <>
    {compressedSubgraph.map((subgraphItem, i) => {
      if (Array.isArray(subgraphItem) && subgraphItem.length > 1) {
        const hasSelected = !!selectedEdge && !!subgraphItem.find(edge => edge.id === selectedEdge.id);
        return (
          <Fragment key={subgraphItem[0].id}>
            <PathGroupConnectors
              className={styles.connectors}
              edges={subgraphItem}
              nodeToEdge
              selectedEdgeId={selectedEdge?.id}
            />
            <div className={`${styles.groupedPreds} ${hasSelected && styles.hasSelected}`}>
              {subgraphItem.map((edge) => {
                const key = `${edge.id}`;
                const selected = !!selectedEdge && (selectedEdge.id === edge.id);
                return (
                  <PathObject
                    activeEntityFilters={EMPTY_STRING_ARRAY}
                    handleEdgeClick={handleEdgeClick}
                    id={edge.id}
                    index={i}
                    inModal
                    isEven={false}
                    key={key}
                    parentPathKey={parentPathKey}
                    path={path}
                    pathViewStyles={styles}
                    pk={pk}
                    selected={selected}
                    selectedEdgeRef={selectedEdgeRef}
                  />
                );
              })}
            </div>
            <PathGroupConnectors
              className={styles.connectors}
              edges={subgraphItem}
              nodeToEdge={false}
              selectedEdgeId={selectedEdge?.id}
            />
          </Fragment>
        );
      }

      const key = (Array.isArray(subgraphItem)) ? subgraphItem[0].id : subgraphItem.id;
      const selected = !!selectedEdge && (selectedEdge.id === key);
      return (
        <PathObject
          activeEntityFilters={EMPTY_STRING_ARRAY}
          handleEdgeClick={handleEdgeClick}
          id={key}
          index={i}
          inModal
          isEven={false}
          key={key}
          parentPathKey={parentPathKey}
          path={path}
          pk={pk}
          pathViewStyles={styles}
          selected={selected}
          selectedEdgeRef={selectedEdgeRef}
        />
      );
    })}
  </>
);

export default CompressedPathObjects;
