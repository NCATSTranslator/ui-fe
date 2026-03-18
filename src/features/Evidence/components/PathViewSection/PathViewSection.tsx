import { FC, RefObject } from 'react';
import Button from '@/features/Core/components/Button/Button';
import PathView from '@/features/ResultItem/components/PathView/PathView';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import { Path, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';

interface PathViewSectionProps {
  path: Path;
  compressedSubgraph: (ResultNode | ResultEdge | ResultEdge[])[] | false;
  isPathViewMinimized: boolean;
  setIsPathViewMinimized: (value: boolean) => void;
  handleEdgeClick: (edgeIDs: string[], path?: Path) => void;
  isOpen: boolean;
  pk: string;
  selectedEdge: ResultEdge | null;
  selectedEdgeRef: RefObject<HTMLElement | null>;
}

const PathViewSection: FC<PathViewSectionProps> = ({
  path,
  compressedSubgraph,
  isPathViewMinimized,
  setIsPathViewMinimized,
  handleEdgeClick,
  isOpen,
  pk,
  selectedEdge,
  selectedEdgeRef,
}) => {
  return (
    <div className={`${styles.pathViewContainer} ${isPathViewMinimized && styles.minimized}`}>
      {compressedSubgraph && (
        <Button 
          variant="secondary" 
          handleClick={() => setIsPathViewMinimized(!isPathViewMinimized)} 
          className={styles.togglePathView}
          iconRight={<ChevDown />}
        >
          {isPathViewMinimized ? "Expand" : "Collapse"}
        </Button>
      )}
      <PathView
        pathArray={[path]}
        selectedPaths={new Set()}
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