import { FC, RefObject } from 'react';
import PathView from '@/features/ResultItem/components/PathView/PathView';
import { Path, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';

const EMPTY_PATH_SET = new Set<Path>();

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
  return (
    <div className={styles.pathViewContainer}>
      <PathView
        pathArray={[path]}
        selectedPaths={EMPTY_PATH_SET}
        handleEdgeSpecificEvidence={handleEdgeClick}
        activeEntityFilters={[]}
        pathFilterState={{}}
        isEven={false}
        active={isOpen}
        activeFilters={[]}
        pk={pk}
        setShowHiddenPaths={() => {}}
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