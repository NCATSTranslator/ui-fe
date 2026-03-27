import { useQueries } from "@tanstack/react-query";

const CLINICAL_TRIALS_API = "https://clinicaltrials.gov/api/v2/studies";
const CLINICAL_TRIALS_URL = "https://clinicaltrials.gov/study";

export interface ClinicalTrialMeta {
  nctId: string;
  title: string | null;
  year: string | null;
  url: string;
}

const fetchClinicalTrialMetadata = async (nctId: string): Promise<ClinicalTrialMeta> => {
  const res = await fetch(
    `${CLINICAL_TRIALS_API}/${nctId}?format=json&fields=LastUpdatePostDate%7CBriefTitle`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch metadata for ${nctId}: ${res.status}`);
  }

  const data = await res.json();
  const title = data?.protocolSection?.identificationModule?.briefTitle ?? null;
  const date = data?.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date ?? null;
  const year = date ? date.split("-")[0] : null;

  return {
    nctId,
    title,
    year,
    url: `${CLINICAL_TRIALS_URL}/${nctId}`,
  };
};

const useClinicalTrialMetadata = (nctIds: string[]) => {
  const results = useQueries({
    queries: nctIds.map((nctId) => ({
      queryKey: ["clinicalTrialMeta", nctId],
      queryFn: () => fetchClinicalTrialMetadata(nctId),
      staleTime: Infinity,
      enabled: nctIds.length > 0,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const trials: ClinicalTrialMeta[] = results.map((r, i) =>
    r.data ?? { nctId: nctIds[i], title: null, year: null, url: `${CLINICAL_TRIALS_URL}/${nctIds[i]}` }
  );

  return { trials, isLoading };
};

export default useClinicalTrialMetadata;
