import { useQuery } from "@tanstack/react-query";
import { post, fetchWithErrorHandling } from "@/features/Common/utils/web";
import { API_PATH_PREFIX } from "@/features/UserAuth/utils/userApi";

type NodeDescriptionsResponse = Record<string, string>;

const fetchNodeTypeDefinition = async (nodeType: string): Promise<string | null> => {
  const url = `${API_PATH_PREFIX}/biolink/node/description`;
  const data = await fetchWithErrorHandling<NodeDescriptionsResponse>(
    () => post(url, [nodeType])
  );
  return data[nodeType] ?? null;
};

/**
 * A hook that fetches the definition of a node type.
 * @param nodeType - The type of the node to fetch the definition of.
 * @returns The definition of the node type.
 */
const useNodeTypeDefinition = (nodeType: string | null) => {
  return useQuery({
    queryKey: ["nodeTypeDefinition", nodeType],
    queryFn: () => fetchNodeTypeDefinition(nodeType!),
    enabled: !!nodeType,
  });
};

export default useNodeTypeDefinition;
