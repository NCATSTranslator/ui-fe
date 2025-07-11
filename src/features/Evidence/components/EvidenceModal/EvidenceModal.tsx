import {useState, useEffect, useRef, FC, useMemo} from "react";
import Modal from "@/features/Common/components/Modal/Modal";
import styles from './EvidenceModal.module.scss';
import { getCompressedSubgraph, getCompressedEdge, hasSupport } from "@/features/Common/utils/utilities";
import { isResultEdge, Path, Result, ResultEdge, ResultNode, ResultSet } from "@/features/ResultList/types/results.d";
import { getResultSetById } from "@/features/ResultList/slices/resultsSlice";
import { useSelector } from 'react-redux';
import { currentPrefs } from "@/features/UserAuth/slices/userSlice";
import Tooltip from "@/features/Common/components/Tooltip/Tooltip";
import { useSeenStatus } from "@/features/ResultItem/hooks/resultHooks";
import { useEvidenceData } from "@/features/Evidence/hooks/evidenceHooks";
import PathViewSection from "@/features/Evidence/components/PathViewSection/PathViewSection";
import EvidenceTabs from "@/features/Evidence/components/EvidenceTabs/EvidenceTabs";

interface EvidenceModalProps {
  edge: ResultEdge | null;
  isOpen: boolean;
  onClose: () => void;
  path?: Path | null;
  pathKey: string
  pk: string;
  result: Result | null;
}

const EvidenceModal: FC<EvidenceModalProps> = ({
  edge = null,
  isOpen,
  onClose,
  path = null,
  pathKey = "",
  pk,
  result }) => {

  const prefs = useSelector(currentPrefs);
  const resultSet = useSelector(getResultSetById(pk));

  const hasBeenOpened = useRef(false);
  const [selectedEdge, setSelectedEdge] = useState(edge);
  const [edgeLabel, setEdgeLabel] = useState<string | null>(null);
  const [isPathViewMinimized, setIsPathViewMinimized] = useState(false);
  const isInferred = hasSupport(selectedEdge);

  const { isEdgeSeen, markEdgeSeen, markEdgeUnseen } = useSeenStatus(pk);
  const edgeSeen = !!selectedEdge?.id && isEdgeSeen(selectedEdge.id);

  const {
    publications,
    sources,
    clinicalTrials,
    miscEvidence,
    handleSelectedEdge: handleEvidenceData,
    setPublications
  } = useEvidenceData({ setEdgeLabel });

  const compressedSubgraph: (ResultNode | ResultEdge | ResultEdge[])[] | false = useMemo(()=>{
    return path?.compressedSubgraph && !!resultSet ? getCompressedSubgraph(resultSet, path.compressedSubgraph) : false;
  }, [path, resultSet]);

  const handleClose = () => {
    onClose();
    setIsPathViewMinimized(false);
    hasBeenOpened.current = false;
  }

  const handleModalOpen = (resultSet: ResultSet, selEdge: ResultEdge) => {
    handleSelectedEdge(resultSet, selEdge);
  }

  useEffect(() => {
    if(isOpen && !hasBeenOpened.current && !!edge && resultSet) {
      handleModalOpen(resultSet, edge);
      hasBeenOpened.current = true;
    }
  })

  // Updated handleSelectedEdge to use the hook and mark edge as seen
  const handleSelectedEdge = (resultSet: ResultSet, selEdge: ResultEdge) => {
    if (selEdge === null || selEdge === undefined)
      return;

    setSelectedEdge(selEdge);
    handleEvidenceData(resultSet, selEdge);
    markEdgeSeen(selEdge.id);
  }

  const handleEdgeClick = (edgeIDs: string[]) => {
    if(!resultSet)
      return;
    const getEdgeFromSubgraph = (edgeID: string, subgraph: (ResultEdge | ResultNode | ResultEdge[])[]) => {
      for(let i = 1; i < subgraph.length; i+=2) {
        const edgeItem = subgraph[i];
        if(Array.isArray(edgeItem)) {
          let edge = edgeItem.find(edge => edge.id === edgeID);
          if(!!edge)
            return edge;
        } else {
          if(edgeItem.id === edgeID)
            return subgraph[i];
        }
      }
      return false;
    }
    let edge;
    if(compressedSubgraph) 
      edge = getEdgeFromSubgraph(edgeIDs[0], compressedSubgraph)
    else
      edge = getCompressedEdge(resultSet, edgeIDs);
      
    if(!isResultEdge(edge) || !selectedEdge || !resultSet)
      return;

    handleSelectedEdge(resultSet, edge)
  }

  const handleToggleSeen = () => {
    if(selectedEdge === null) {
      console.warn("edge seen status cannot be toggled, selectedEdge is null."); 
      return;
    }
    if(edgeSeen)
      markEdgeUnseen(selectedEdge.id);
    else
      markEdgeSeen(selectedEdge.id);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={`${styles.evidenceModal} evidence-modal`} containerClass={`${styles.evidenceContainer}`}>
      {result?.drug_name &&
        <div className={styles.top}>
          <h5 className={styles.title}>{isInferred ? "Indirect" : "Direct"} Path {pathKey} Evidence</h5>
          <div className={styles.labelContainer}>
            {
              edgeLabel &&
              <p className={styles.subtitle}>{edgeLabel}</p>
            }
            <span className={styles.sep}>·</span>
            <p 
              className={styles.toggleSeen}
              onClick={handleToggleSeen}
              >
              Mark as {edgeSeen ? "Unseen" : "Seen"}
            </p>
          </div>
          <Tooltip id="knowledge-sources-tooltip" >
            <span>The resources that provided the information supporting the selected relationship.</span>
          </Tooltip>
          {
            path &&
            <PathViewSection
              path={path}
              compressedSubgraph={compressedSubgraph}
              isPathViewMinimized={isPathViewMinimized}
              setIsPathViewMinimized={setIsPathViewMinimized}
              handleEdgeClick={handleEdgeClick}
              isOpen={isOpen}
              pk={pk}
              result={result}
              selectedEdge={selectedEdge}
            />
          }
          {
            isInferred
            ?
              <div className={styles.inferredDisclaimer}>
                <p>Supporting evidence for this relationship, including intermediary connections, can be found in the next path(s).</p>
                <p>Reasoning agents that use logic and pattern recognition to find connections between objects identified this path as a possible connection between this result and your search term.</p>
                <a href="/help#reasoner" target="_blank">Learn More about Reasoning Agents</a>
              </div>
            :
              <EvidenceTabs
                isOpen={isOpen}
                publications={publications}
                setPublications={setPublications}
                clinicalTrials={clinicalTrials}
                miscEvidence={miscEvidence}
                sources={sources}
                selectedEdge={selectedEdge}
                pk={pk}
                prefs={prefs}
              />
          }
        </div>
      }
    </Modal>
  );
}

export default EvidenceModal;
