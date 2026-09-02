/**
 * Node color mode: background colors assigned by a node's biolink type.
 *
 * Every biolink type the app renders collapses into one of six buckets. Bucket
 * assignments live in biolinkTypeRegistry.ts alongside icon mappings.
 */

import {
  getRegistryEntry,
  type NodeColorBucket,
} from '@/features/Core/utils/biolinkTypeRegistry';

export type { NodeColorBucket };

export interface NodeColors {
  /** Resting background color. */
  background: string;
  /** Background color while hovered. */
  hoverBackground: string;
}

/** Palette choice for the `other` bucket while color mode is on. */
const OTHER_BACKGROUND = '#C1C0D1';

/**
 * Labels and icons stay near-black ($black / #202124). Every pair below clears
 * WCAG AA against that foreground, resting and hovered.
 */
export const NODE_COLORS: Record<NodeColorBucket, NodeColors> = {
  disease:           { background: '#F08CB9', hoverBackground: '#D17CA3' },
  drugChemical:      { background: '#EECC74', hoverBackground: '#CFB268' },
  biologicalProcess: { background: '#94E0AF', hoverBackground: '#83C39A' },
  geneProtein:       { background: '#8CC8F0', hoverBackground: '#7CAFD1' },
  phenotype:         { background: '#DE82E8', hoverBackground: '#C273CB' },
  other:             { background: OTHER_BACKGROUND, hoverBackground: '#A9A8B7' },
};

/**
 * Resolves a single biolink type to its color bucket. Accepts prefixed
 * (`biolink:Drug`), bare (`Drug`), and the lowercase `phenotype` alias the
 * icon map also carries.
 */
export const getNodeColorBucket = (type: string | undefined | null): NodeColorBucket =>
  getRegistryEntry(type)?.colorBucket ?? 'other';

/**
 * Colors for a node's type. Uses the primary type only, matching both the icon
 * lookup and translator-graph-view's own primary-type handling, so a node's
 * icon and color never disagree.
 */
export const getNodeColors = (type: string | undefined | null): NodeColors =>
  NODE_COLORS[getNodeColorBucket(type)];
