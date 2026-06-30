import { Path } from '@/features/ResultList/types/results.d';

export type EvidenceTabName = 'Publications' | 'Clinical Trials' | 'Miscellaneous' | 'Knowledge Sources';

export interface EvidenceNavigationOptions {
  edgeId: string;
  path?: Path;
  pathKey?: string;
  compressedEdgeSets?: string[][];
  tab?: EvidenceTabName;
  // Explicit result id to navigate against. Used when the route does not provide
  // one (e.g. the results list view, where each item supplies its own id).
  resultId?: string;
}
