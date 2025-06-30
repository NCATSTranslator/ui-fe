import { ResultEdge, ResultNode } from '@/features/Evidence/types/evidence';
import { LayoutOptions, NodeSingular, EdgeSingular } from 'cytoscape';

export interface GraphDataObject {
  graphRef: RefObject<HTMLDivElement>;
  graphNavigatorContainerId: string;
  graphTooltipIdString: string;
  edgeInfoWindowIdString: string;
  graphScrollOverlayId: string;
  graph: any;
  layout: {
    label: string;
    name: string;
  };
  handleNodeClick: (nodes: any) => void;
  clearSelectedPaths: () => void;
  highlightClass: string;
  hideClass: string;
  excludedClass: string;
}

export interface RenderableNode {
  id: string;
  label: string;
  type: string;
  provenance: string | null;
  isTargetCount: number;
  isSourceCount: number;
  isTargetEdges: RenderableEdge[];
  isSourceEdges: RenderableEdge[];
}

export interface RenderableEdge {
  id: string;
  source: string;
  sourceLabel: string;
  target: string;
  targetLabel: string;
  label: string;
  inferred: boolean;
}

export interface RenderableGraph {
  nodes: RenderableNode[];
  edges: RenderableEdge[];
}

export interface GraphLayout extends LayoutOptions {
  label: string;
  name: string;
  spacingFactor?: number;
  avoidOverlap?: boolean;
  directed?: boolean;
  edgeDistances?: string;
  klay?: any;
  ready?: (ev: any) => void;
}

export interface GraphLayoutList {
  [key: string]: GraphLayout;
}