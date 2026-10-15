import { useMemo } from 'react';
import { ResultEdge, ResultSet } from '@/features/ResultList/types/results';
import { checkEdgesForClinicalTrials, checkEdgesForPubs } from '@/features/Evidence/utils/utilities';
import { isAcceptedOntologyEdge } from '@/features/ResultItem/utils/utilities';
import { edgesToTooltipEntries } from '@/features/Core/components/Tooltips/tooltipMappers';

/**
 * Derives the evidence flags and tooltip entries for a predicate's edge,
 * including any edges compressed into it.
 */
export const usePredicateEdgeMeta = (resultSet: ResultSet | null | undefined, formattedEdge: ResultEdge) => {
  const edgesToDisplay = useMemo<ResultEdge[]>(
    () => (!!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0)
      ? [...formattedEdge.compressed_edges, formattedEdge]
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

  return { hasMore, hasPubs, hasCTs, isAcceptedOntology, tooltipEdgeEntries };
};
