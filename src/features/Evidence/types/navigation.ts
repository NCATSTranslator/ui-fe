import { Path } from '@/features/ResultList/types/results.d';

export type EvidenceTabName = 'Publications' | 'Clinical Trials' | 'Miscellaneous' | 'Knowledge Sources';

export interface EvidenceNavigationOptions {
  edgeId: string;
  path?: Path;
  pathKey?: string;
  compressedEdgeSets?: string[][];
  tab?: EvidenceTabName;
}
