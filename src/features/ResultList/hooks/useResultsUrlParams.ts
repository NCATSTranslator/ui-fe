import { useMemo } from 'react';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { formatBiolinkTypeString } from '@/features/Core/utils/stringFormatters';
import { queryTypes } from '@/features/Query/utils/queryTypes';
import { getBiolinkCategoryDisplay } from '@/features/Query/utils/biolinkCategories';
import { QueryType } from '@/features/Query/types/querySubmission';

export interface ResultsUrlParams {
  currentQueryID: string | null;
  /** `?loading=true` forces the loading state even without a query ID */
  loading: boolean;
  presetTypeID: string | null;
  isPathfinder: boolean;
  isLookup: boolean;
  presetTypeObject: QueryType | null;
  nodeLabelParam: string | null;
  nodeIdParam: string | null;
  pathfinderIdOne: string | null;
  pathfinderLabelOne: string | null;
  pathfinderIdTwo: string | null;
  pathfinderLabelTwo: string | null;
  constraintText: string;
  lookupCategory: string | null;
  /** The node the list is about: the first pathfinder term for lookups, otherwise the query node */
  effectiveNodeLabel: string | null;
  effectiveNodeId: string | null;
}

/** Reads everything ResultList needs from the (decoded) results URL query vars. */
/** `decodedParams` is the decoded query string from useDecodedParams */
export const useResultsUrlParams = (decodedParams: Parameters<typeof getDataFromQueryVar>[1]): ResultsUrlParams => useMemo(() => {
  const currentQueryID = getDataFromQueryVar("q", decodedParams);
  const presetTypeID = getDataFromQueryVar("t", decodedParams);
  const isPathfinder = presetTypeID === "p";
  const isLookup = presetTypeID === "l";
  const nodeLabelParam = getDataFromQueryVar("l", decodedParams);
  const nodeIdParam = getDataFromQueryVar("i", decodedParams);
  const pathfinderIdOne = getDataFromQueryVar("ione", decodedParams);
  const pathfinderLabelOne = getDataFromQueryVar("lone", decodedParams);
  return {
    currentQueryID,
    loading: getDataFromQueryVar("loading", decodedParams) === 'true',
    presetTypeID,
    isPathfinder,
    isLookup,
    presetTypeObject: presetTypeID ? queryTypes.find(type => type.id === parseInt(presetTypeID)) ?? null : null,
    nodeLabelParam,
    nodeIdParam,
    pathfinderIdOne,
    pathfinderLabelOne,
    pathfinderIdTwo: getDataFromQueryVar("itwo", decodedParams),
    pathfinderLabelTwo: getDataFromQueryVar("ltwo", decodedParams),
    constraintText: formatBiolinkTypeString(getDataFromQueryVar("c", decodedParams) || ""),
    lookupCategory: getDataFromQueryVar("cat", decodedParams),
    effectiveNodeLabel: isLookup ? pathfinderLabelOne : nodeLabelParam,
    effectiveNodeId: isLookup ? pathfinderIdOne : nodeIdParam,
  };
}, [decodedParams]);

/** The query's display title: the resolved saved-query title when known, otherwise built from URL params. */
export const useQueryTitle = (resolvedQueryTitle: string | null | undefined, params: ResultsUrlParams): string => {
  const { isLookup, isPathfinder, pathfinderLabelOne, lookupCategory, nodeLabelParam, presetTypeObject } = params;
  return useMemo(() => {
    if (resolvedQueryTitle) return resolvedQueryTitle;
    if (isLookup && pathfinderLabelOne) {
      const catDisplay = getBiolinkCategoryDisplay(lookupCategory || '', true);
      return `${pathfinderLabelOne} — ${catDisplay} Lookup`;
    }
    // Fallback: construct title from URL parameters
    if (nodeLabelParam) {
      const typeLabel = isPathfinder ? 'Pathfinder' : (presetTypeObject?.targetType || 'Query');
      return `${nodeLabelParam} — ${typeLabel}s`;
    }
    return '';
  }, [resolvedQueryTitle, nodeLabelParam, isPathfinder, isLookup, pathfinderLabelOne, lookupCategory, presetTypeObject]);
};
