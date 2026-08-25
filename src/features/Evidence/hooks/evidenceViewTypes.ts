import { Dispatch, SetStateAction, RefObject } from 'react';
import { ResultSet, ResultEdge, ResultNode, Path, Result } from '@/features/ResultList/types/results.d';
import { EvidenceTabName } from '@/features/Evidence/types/navigation';
import { PublicationObject, Provenance, TrialObject } from '@/features/Evidence/types/evidence';
import { Preferences } from '@/features/UserAuth/types/user';

export type CompressedSubgraph = (ResultNode | ResultEdge | ResultEdge[])[] | false;

export interface EvidenceViewContentProps {
  edgeLabel: string | null;
  evidenceSubtitle: string | null;
  edgeSeen: boolean;
  handleToggleSeen: () => void;
  path: Path | null;
  compressedSubgraph: CompressedSubgraph;
  handleEdgeClick: (edgeIDs: string[]) => void;
  pk: string;
  selectedEdge: ResultEdge;
  selectedEdgeDomRef: RefObject<HTMLElement | null>;
  isFilteredOut: boolean;
  onClearFilters: () => void;
  publications: PublicationObject[];
  setPublications: Dispatch<SetStateAction<PublicationObject[]>>;
  clinicalTrials: TrialObject[];
  miscEvidence: PublicationObject[];
  sources: Provenance[];
  prefs: Preferences;
  initialTab: EvidenceTabName | undefined;
  isCanvasOnlyMode: boolean;
}

export type EvidenceViewModel =
  | { status: 'no-query' }
  | { status: 'loading' }
  | { status: 'no-result'; resultId?: string }
  | { status: 'no-edge'; edgeId?: string }
  | { status: 'ready'; content: EvidenceViewContentProps };

export interface EvidenceViewStatusParams {
  queryId: string | null | undefined;
  resultSet: ResultSet | null | undefined;
  queryStatus: { isLoading?: boolean } | null | undefined;
  result: Result | undefined;
  selectedEdge: ResultEdge | null;
  resolvedEdge: ResultEdge | null;
  resultId?: string;
  edgeId?: string;
  isCanvasOnlyMode?: boolean;
  canvasEdgeLoading?: boolean;
  canvasEdgeError?: boolean;
}
