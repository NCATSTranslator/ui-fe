import { useMemo, useCallback, FC, ReactNode } from "react";
import { useParams } from "react-router-dom";
import styles from "./ShareModal.module.scss";
import Modal from "@/features/Core/components/Modal/Modal";
import Button from "@/features/Core/components/Button/Button";
import { getPathfinderResultsShareURLPath, getResultsShareURLPath, getLookupResultsShareURLPath, getDecodedParams } from "@/features/Core/utils/web";
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { AutocompleteItem } from "@/features/Query/types/querySubmission";
import { currentConfig } from "@/features/UserAuth/slices/userSlice";
import { useSelector } from "react-redux";

type ShareContext = 'list' | 'result' | 'evidence' | 'node';

const SHARE_CONTENT: Record<ShareContext, { heading: string; body: ReactNode }> = {
  list: {
    heading: "Share this result set",
    body: (
      <>
        <p>Share a direct link to this result set.</p>
      </>
    ),
  },
  result: {
    heading: "Share this result",
    body: (
      <p>Share a direct link to this result.</p>
    ),
  },
  evidence: {
    heading: "Share this evidence",
    body: (
      <p>Share a direct link to this relationship's evidence.</p>
    ),
  },
  node: {
    heading: "Share this object",
    body: (
      <p>Share a direct link to this object&apos;s information.</p>
    ),
  },
};

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  qid: string;
  label?: string | null;
  nodeID?: string | null;
  typeID?: string | null;
  shareResultID?: string | null;
}

const ShareModal: FC<ShareModalProps> = ({ isOpen, onClose, qid, label = null, nodeID = null, typeID = null, shareResultID = null }) => {
  const config = useSelector(currentConfig);
  const decodedParams = getDecodedParams();
  const { resultId: routeResultId, nodeId, edgeId } = useParams();

  const queryLabel = label || getDataFromQueryVar("l", decodedParams) || '';
  const queryItemID = nodeID || getDataFromQueryVar("i", decodedParams) || '';
  const queryTypeID = typeID || getDataFromQueryVar("t", decodedParams) || '';
  const queryResultID = shareResultID || routeResultId || '0';
  const isPathfinder = queryTypeID === 'p';
  const isLookup = queryTypeID === 'l';

  const shareContext: ShareContext = useMemo(() => {
    if (edgeId) return 'evidence';
    if (nodeId) return 'node';
    if (shareResultID || routeResultId) return 'result';
    return 'list';
  }, [edgeId, nodeId, shareResultID, routeResultId]);

  const shareURL = useMemo(() => {
    if (shareContext === 'evidence' || shareContext === 'node') {
      return window.location.href;
    }

    const shouldHash = config?.include_hashed_parameters;
    let path: string;

    if (isPathfinder) {
      const itemOne: AutocompleteItem = {
        id: getDataFromQueryVar('ione', decodedParams) || "",
        label: getDataFromQueryVar('lone', decodedParams) || "",
        isExact: false,
        score: Infinity
      };
      const itemTwo: AutocompleteItem = {
        id: getDataFromQueryVar('itwo', decodedParams) || "",
        label: getDataFromQueryVar('ltwo', decodedParams) || "",
        isExact: false,
        score: Infinity
      };
      const constraint = getDataFromQueryVar('c', decodedParams) || "";
      path = getPathfinderResultsShareURLPath(itemOne, itemTwo, queryResultID, constraint, qid, shouldHash);
    } else if (isLookup) {
      const item: AutocompleteItem = {
        id: getDataFromQueryVar('ione', decodedParams) || "",
        label: getDataFromQueryVar('lone', decodedParams) || "",
        isExact: false,
        score: Infinity
      };
      const objectCategory = getDataFromQueryVar('cat', decodedParams) || "";
      path = getLookupResultsShareURLPath(item, objectCategory, queryResultID, qid, shouldHash);
    } else {
      path = getResultsShareURLPath(queryLabel, queryItemID, queryTypeID, queryResultID, qid, shouldHash);
    }

    return encodeURI(`${window.location.origin}/${path}`);
  }, [shareContext, isPathfinder, decodedParams, queryResultID, qid, config?.include_hashed_parameters, queryLabel, queryItemID, queryTypeID]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareURL);
  }, [shareURL]);

  const { heading, body } = SHARE_CONTENT[shareContext];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={styles.feedbackModal}
      containerClass={styles.feedbackContainer}
    >
      <h5>{heading}</h5>
      {body}
      <div className={styles.copyContainer}>
        <p className={styles.url} data-testid='share-url-container'>{shareURL}</p>
        <Button handleClick={handleCopyLink}>Copy Link</Button>
      </div>
    </Modal>
  );
};

export default ShareModal;
