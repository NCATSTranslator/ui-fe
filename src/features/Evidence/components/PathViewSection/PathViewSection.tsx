import { FC, RefObject, useMemo } from 'react';
import PathView from '@/features/ResultItem/components/PathView/PathView';
import { Path, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';

interface PathViewSectionProps {
  path: Path;
  compressedSubgraph: (ResultNode | ResultEdge | ResultEdge[])[] | false;
  handleEdgeClick: (edgeIDs: string[], path?: Path) => void;
  isOpen: boolean;
  pk: string;
  selectedEdge: ResultEdge | null;
  selectedEdgeRef: RefObject<HTMLElement | null>;
}

const PathViewSection: FC<PathViewSectionProps> = ({
  path,
  compressedSubgraph,
  handleEdgeClick,
  isOpen,
  pk,
  selectedEdge,
  selectedEdgeRef,
}) => {
  const pathArray = useMemo(() => [path], [path]);

  return (
    <div className={styles.pathViewContainer}>
      <PathView
        pathArray={pathArray}
        handleEdgeSpecificEvidence={handleEdgeClick}
        isEven={false}
        active={isOpen}
        pk={pk}
        showHiddenPaths={true}
        inModal={true}
        compressedSubgraph={compressedSubgraph}
        selectedEdge={selectedEdge}
        selectedEdgeRef={selectedEdgeRef}
      />
    </div>
  );
}; 

export default PathViewSection;