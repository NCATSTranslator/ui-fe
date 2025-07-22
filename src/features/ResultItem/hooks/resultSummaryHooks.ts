// implement a hook that will generate a summary of a result, sending an endpoint a get request with a payload of the result and the disease and returning an object with a property called response_text
import { Result, ResultSet } from "@/features/ResultList/types/results";
import { useQuery } from "@tanstack/react-query";
import { resultToSummarySpec } from "@/features/ResultItem/utils/resultSummaryFunctions";

const API_URL = `/api/summary`;

export const useResultSummary = (resultSet: ResultSet | null, result: Result, disease: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["resultSummary", result, disease],
    queryFn: async () => {
      const response = await fetch(`${API_URL}`, {
        method: "POST",
        body: JSON.stringify(resultToSummarySpec(resultSet!, result, disease)),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok)
        throw new Error("Failed to fetch summary");
      
      return response.json();
    },
    enabled: false,
    retry: false,
  });

  return { data, isLoading, error, refetch };
}