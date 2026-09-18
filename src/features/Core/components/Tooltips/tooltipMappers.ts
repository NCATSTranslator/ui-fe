import { formatBiolinkEntity, formatBiolinkNode, replaceTreatWithImpact } from '@/features/Core/utils/stringFormatters';
import { getNodeSpecies } from '@/features/ResultList/slices/resultsSlice';
import { getEvidenceFromEdge, getEvidenceCountsFromCanvasEdge } from '@/features/Evidence/utils/utilities';
import { ResultEdge, ResultNode, ResultSet } from '@/features/ResultList/types/results.d';
import { NodeTooltipContentProps } from './NodeTooltipContent';
import { EdgeTooltipEntry } from './EdgeTooltipContent';
import { getNodeDescription } from '@/features/ResultItem/utils/utilities';

const formatPredicate = (predicate: string): string =>
  predicate.includes('treat') ? replaceTreatWithImpact(predicate) : predicate;

const getEdgeEvidenceCounts = (
  resultSet: ResultSet | null,
  edge: ResultEdge,
): { pubCount: number; ctCount: number } => {
  if (resultSet) {
    const evidence = getEvidenceFromEdge(resultSet, edge);
    return { pubCount: evidence.pubs.size, ctCount: evidence.cts.size };
  }
  return getEvidenceCountsFromCanvasEdge(edge);
};

export const nodeToTooltipProps = (node: ResultNode): NodeTooltipContentProps => {
  const type = node.types?.[0]?.replace('biolink:', '') ?? '';
  const nameString = formatBiolinkNode(node.names?.[0] ?? '', type, getNodeSpecies(node));
  const typeString = formatBiolinkEntity(type);
  const description = getNodeDescription(node) ?? '';
  const provenance = (Array.isArray(node.provenance) && node.provenance.length > 0) ? node.provenance[0] : false;
  return { nameString, typeString, description, provenance };
};

export const edgeToTooltipEntry = (resultSet: ResultSet | null, edge: ResultEdge): EdgeTooltipEntry => {
  const { pubCount, ctCount } = getEdgeEvidenceCounts(resultSet, edge);
  return {
    id: edge.id,
    predicate: formatPredicate(edge.predicate),
    description: edge.description ?? undefined,
    predicate_url: edge.predicate_url,
    pubCount,
    ctCount,
  };
};

export const edgesToTooltipEntries = (resultSet: ResultSet | null, edges: ResultEdge[]): EdgeTooltipEntry[] =>
  edges.filter(Boolean).map(edge => edgeToTooltipEntry(resultSet, edge));
