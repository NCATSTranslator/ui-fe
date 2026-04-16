import { formatBiolinkEntity, formatBiolinkNode, replaceTreatWithImpact } from '@/features/Common/utils/utilities';
import { getNodeSpecies } from '@/features/ResultList/slices/resultsSlice';
import { getEvidenceFromEdge } from '@/features/Evidence/utils/utilities';
import { ResultEdge, ResultNode, ResultSet } from '@/features/ResultList/types/results.d';
import { NodeTooltipContentProps } from './NodeTooltipContent';
import { EdgeTooltipEntry } from './EdgeTooltipContent';

export const nodeToTooltipProps = (node: ResultNode): NodeTooltipContentProps => {
  const type = node.types?.[0]?.replace('biolink:', '') ?? '';
  const nameString = formatBiolinkNode(node.names?.[0] ?? '', type, getNodeSpecies(node));
  const typeString = formatBiolinkEntity(type);
  const description = node.descriptions?.[0] ?? '';
  const provenance = (Array.isArray(node.provenance) && node.provenance.length > 0) ? node.provenance[0] : false;
  return { nameString, typeString, description, provenance };
};

export const edgeToTooltipEntry = (resultSet: ResultSet, edge: ResultEdge): EdgeTooltipEntry => {
  const evidence = getEvidenceFromEdge(resultSet, edge);
  const predicate = edge.predicate.includes('treat') ? replaceTreatWithImpact(edge.predicate) : edge.predicate;
  return {
    id: edge.id,
    predicate,
    description: edge.description ?? undefined,
    predicate_url: edge.predicate_url,
    pubCount: evidence.pubs.size,
    ctCount: evidence.cts.size,
  };
};

export const edgesToTooltipEntries = (resultSet: ResultSet, edges: ResultEdge[]): EdgeTooltipEntry[] =>
  edges.filter(Boolean).map(e => edgeToTooltipEntry(resultSet, e));
