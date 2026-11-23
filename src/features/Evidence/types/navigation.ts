import { Path } from '@/features/ResultList/types/results.d';

/** A section of the evidence view that a link can open the view scrolled to. */
export type EvidenceSectionName = 'Publications' | 'Clinical Trials' | 'Drug Labels' | 'Accepted Ontology' | 'Miscellaneous' | 'Databases';

export interface EvidenceNavigationOptions {
  edgeId: string;
  path?: Path;
  pathKey?: string;
  compressedEdgeSets?: string[][];
  // Section to scroll to on arrival. Still called "tab" to match the URL parameter older links use.
  tab?: EvidenceSectionName;
  // Explicit result id to navigate against. Used when the route does not provide
  // one (e.g. the results list view, where each item supplies its own id).
  resultId?: string;
  extraParams?: Record<string, string>;
}
