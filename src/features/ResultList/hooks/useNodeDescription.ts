import { useEffect, useState, RefObject } from 'react';
import { Result, ResultSet } from '@/features/ResultList/types/results.d';

/** The description of the query's node, read from the result set once results arrive. */
export const useNodeDescription = (rawResults: RefObject<ResultSet | null>, nodeIdParam: string | null, formattedResults: Result[]) => {
  const [nodeDescription, setNodeDescription] = useState("");
  useEffect(() => {
    if (!nodeIdParam)
      return;
    const node = rawResults.current?.data?.nodes[nodeIdParam];
    if (node && node.descriptions.length > 0)
      setNodeDescription(node.descriptions[0].replaceAll('"', ''));
  }, [formattedResults, nodeIdParam, rawResults]);
  return [nodeDescription, setNodeDescription] as const;
};
