import { useMemo } from 'react';
import { ResultEdge, ResultSet } from '@/features/ResultList/types/results';
import { checkEdgesForClinicalTrials, checkEdgesForPubs, isAcceptedOntologyEdge } from '@/features/Evidence/utils/utilities';
import { edgesToTooltipEntries } from '@/features/Core/components/Tooltips/tooltipMappers';
import { getCompressedEdge } from '@/features/Core/utils/resultHelpers';

/**
 * Resolves the edge a predicate displays. Several edge IDs are compressed into one edge led by
 * the most valuable predicate; topEdgeId is the edge behind that label, so a click opens it.
 */
export const useCompressedPredicateEdge = (resultSet: ResultSet | null | undefined, edgeIds: string[], edge: ResultEdge) => {
  const formattedEdge = useMemo(
    () => (!!resultSet && edgeIds.length > 1) ? getCompressedEdge(resultSet, edgeIds) : edge,
    [resultSet, edgeIds, edge]
  );
  const topEdgeId = edgeIds.includes(formattedEdge.id) ? formattedEdge.id : edgeIds[0];

  return { formattedEdge, topEdgeId };
};

/**
 * Derives the evidence flags and tooltip entries for a predicate's edge,
 * including any edges compressed into it.
 */
export const usePredicateEdgeMeta = (resultSet: ResultSet | null | undefined, formattedEdge: ResultEdge) => {
  const edgesToDisplay = useMemo<ResultEdge[]>(
    () => (!!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0)
      ? [formattedEdge, ...formattedEdge.compressed_edges]
      : [formattedEdge],
    [formattedEdge]
  );

  const hasMore = edgesToDisplay.length > 1;

  const { hasPubs, hasCTs, isAcceptedOntology } = useMemo(() => ({
    hasPubs: checkEdgesForPubs(edgesToDisplay),
    hasCTs: checkEdgesForClinicalTrials(edgesToDisplay),
    isAcceptedOntology: isAcceptedOntologyEdge(formattedEdge),
  }), [edgesToDisplay, formattedEdge]);

  const tooltipEdgeEntries = useMemo(
    () => resultSet ? edgesToTooltipEntries(resultSet, edgesToDisplay.filter(Boolean)) : [],
    [resultSet, edgesToDisplay]
  );

  const hasDrugLabels = tooltipEdgeEntries.some(entry => entry.drugLabelCount > 0);

  return { hasMore, hasPubs, hasCTs, hasDrugLabels, isAcceptedOntology, tooltipEdgeEntries };
};
