import { Result, ResultSet } from "@/features/ResultList/types/results";
import { useQuery } from "@tanstack/react-query";
import { resultToSummarySpec } from "@/features/ResultItem/utils/resultSummaryFunctions";

const API_URL = `https://transltr-bma-ui-dev.ncats.io/api/summary`;

export const useResultSummary = (resultSet: ResultSet | null, result: Result, diseaseId: string, diseaseName: string, diseaseDescription: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["resultSummary", result, diseaseId, diseaseName, diseaseDescription],
    queryFn: async () => {
      const response = await fetch(`${API_URL}`, {
        method: "POST",
        body: JSON.stringify(resultToSummarySpec(resultSet!, result, diseaseId, diseaseName, diseaseDescription)),
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