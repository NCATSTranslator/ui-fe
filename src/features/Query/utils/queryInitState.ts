import { QueryItem, QueryType } from '@/features/Query/types/querySubmission';
import { autocompleteItemFromNodeParams } from '@/features/Query/hooks/queryInitHelpers';
import { getQueryTypeForCategory, isUnsupportedSmartQueryCategory, queryTypes } from '@/features/Query/utils/queryTypes';

export const buildInitialQueryItemState = (
  initPresetTypeObject: QueryType | null,
  initNodeLabelParam: string | null,
  initNodeIdParam: string | null,
  initNodeCategoryParam?: string | null,
): { queryItem: QueryItem; inputText: string; categoryUnsupported: boolean } => {
  const categoryUnsupported = isUnsupportedSmartQueryCategory(initNodeCategoryParam);
  const nodeId = categoryUnsupported ? null : initNodeIdParam;
  const nodeLabel = categoryUnsupported ? null : initNodeLabelParam;
  const nodeCategory = categoryUnsupported ? null : initNodeCategoryParam;
  const initPresetType =
    initPresetTypeObject
    || (categoryUnsupported ? null : getQueryTypeForCategory(nodeCategory))
    || queryTypes[0];
  const initSelectedNode = autocompleteItemFromNodeParams(nodeId, nodeLabel, nodeCategory);

  return {
    queryItem: {
      type: initPresetType,
      node: initSelectedNode,
    },
    inputText: categoryUnsupported ? '' : (initNodeLabelParam || initNodeIdParam || ''),
    categoryUnsupported,
  };
};
