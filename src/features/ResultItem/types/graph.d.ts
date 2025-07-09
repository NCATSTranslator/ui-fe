import { ResultEdge, ResultNode } from '@/features/Evidence/types/evidence';
import { LayoutOptions, NodeSingular, EdgeSingular, Core } from 'cytoscape';
import { RefObject } from 'react';

export interface GraphDataObject {
  graphRef: RefObject<HTMLDivElement>;
  graphNavigatorContainerId: string;
  graphTooltipIdString: string;
  edgeInfoWindowIdString: string;
  graphScrollOverlayId: string;
  graph: Core;
  layout: {
    label: string;
    name: string;
  };
  handleNodeClick: (nodes: NodeSingular | NodeSingular[]) => void;
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
  klay?: {
    direction?: string;
    edgeSpacingFactor?: number;
    [key: string]: unknown;
  };
  ready?: (ev: { target: { options: { eles: unknown[] } }; cy: Core }) => void;
}

export interface GraphLayoutList {
  [key: string]: GraphLayout;
}