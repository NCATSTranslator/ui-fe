import { AutocompleteItem } from '@/features/Query/types/querySubmission';
import { toPrefixedBiolinkCategory } from '@/features/Query/utils/biolinkCategories';

export const autocompleteItemFromNodeParams = (
  nodeId: string | null | undefined,
  nodeLabel: string | null | undefined,
  nodeCategory?: string | null,
): AutocompleteItem | null => {
  if (!nodeId) return null;
  return {
    id: nodeId,
    label: nodeLabel || nodeId,
    match: '',
    isExact: false,
    score: Infinity,
    types: nodeCategory ? [toPrefixedBiolinkCategory(nodeCategory)] : [],
  };
};
