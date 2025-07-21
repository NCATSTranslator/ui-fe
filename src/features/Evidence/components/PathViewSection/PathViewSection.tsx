import { FC, RefObject } from 'react';
import Button from '@/features/Common/components/Button/Button';
import PathView from '@/features/ResultItem/components/PathView/PathView';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import { Path, Result, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import styles from '@/features/Evidence/components/EvidenceModal/EvidenceModal.module.scss';

interface PathViewSectionProps {
  path: Path;
  compressedSubgraph: (ResultNode | ResultEdge | ResultEdge[])[] | false;
  isPathViewMinimized: boolean;
  setIsPathViewMinimized: (value: boolean) => void;
  handleEdgeClick: (edgeIDs: string[], path?: Path) => void;
  isOpen: boolean;
  pk: string;
  result: Result;
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
  result,
  selectedEdge,
  selectedEdgeRef,
}) => {
  return (
    <div className={`${styles.pathViewContainer} ${isPathViewMinimized && styles.minimized}`}>
      {compressedSubgraph && (
        <Button 
          isSecondary 
          handleClick={() => setIsPathViewMinimized(!isPathViewMinimized)} 
          className={styles.togglePathView}
        >
          {isPathViewMinimized ? "Expand" : "Collapse"}
          <ChevDown />
        </Button>
      )}
      <PathView
        pathArray={[path]}
        selectedPaths={new Set()}
        handleEdgeSpecificEvidence={handleEdgeClick}
        handleActivateEvidence={(path) => console.log(path)}
        activeEntityFilters={[]}
        pathFilterState={{}}
        isEven={false}
        active={isOpen}
        activeFilters={[]}
        pk={pk}
        setShowHiddenPaths={() => {}}
        showHiddenPaths={true}
        resultID={result.id}
        inModal={true}
        compressedSubgraph={compressedSubgraph}
        selectedEdge={selectedEdge}
        selectedEdgeRef={selectedEdgeRef}
      />
    </div>
  );
}; 

export default PathViewSection;