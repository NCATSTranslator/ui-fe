import { ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';

export interface HoverAnchor {
  x: number;
  y: number;
}

export type GraphHoverTarget =
  | { kind: 'node'; id: string; node: ResultNode; anchor?: HoverAnchor }
  | { kind: 'edge'; id: string; edge: ResultEdge; anchor?: HoverAnchor }
  | null;