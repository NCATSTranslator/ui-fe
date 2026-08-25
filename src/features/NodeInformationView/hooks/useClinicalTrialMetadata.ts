import { useQueries } from "@tanstack/react-query";

const CLINICAL_TRIALS_API = "https://clinicaltrials.gov/api/v2/studies";
const CLINICAL_TRIALS_URL = "https://clinicaltrials.gov/study";

const METADATA_FIELDS = [
  "BriefTitle",
  "LastUpdatePostDate",
  "StartDate",
  "Phase",
  "OverallStatus",
  "EnrollmentCount",
].join("|");

export interface ClinicalTrialMeta {
  nctId: string;
  title: string | null;
  year: string | null;
  url: string;
  startDate: string | null;
  phases: string[];
  phase: number;
  status: string | null;
  enrollmentCount: number | null;
  enrollmentType: "enrolled" | "anticipated" | null;
}

const parsePhaseNumber = (phases: string[]): number => {
  if (!phases.length) return 0;
  const match = phases[0].match(/PHASE(\d+)/i);
  if (match) return parseInt(match[1], 10);
  if (phases[0] === "EARLY_PHASE1") return 1;
  return 0;
};

export const formatTrialPhase = (phases: string[], fallbackPhase = 0): string => {
  if (phases.length > 1) {
    return phases
      .map((phase) => phase.replace(/^EARLY_/, "").replace(/^PHASE/, ""))
      .join("/");
  }
  if (phases.length === 1) {
    const match = phases[0].match(/PHASE(\d+)/i);
    if (match) return match[1];
    if (phases[0] === "EARLY_PHASE1") return "1";
    if (phases[0] === "NA") return "";
  }
  return fallbackPhase ? String(fallbackPhase) : "";
};

const parseEnrollmentType = (type: string | undefined): "enrolled" | "anticipated" | null => {
  if (type === "ACTUAL") return "enrolled";
  if (type === "ESTIMATED") return "anticipated";
  return null;
};

const emptyClinicalTrialMeta = (nctId: string): ClinicalTrialMeta => ({
  nctId,
  title: null,
  year: null,
  url: `${CLINICAL_TRIALS_URL}/${nctId}`,
  startDate: null,
  phases: [],
  phase: 0,
  status: null,
  enrollmentCount: null,
  enrollmentType: null,
});

const getPath = (obj: unknown, keys: string[]): unknown => {
  let current = obj;
  for (const key of keys) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

const asString = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const asNumber = (value: unknown): number | null => (typeof value === 'number' ? value : null);
const asStringArray = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
);

const parseClinicalTrialMetadata = (
  nctId: string,
  protocol: unknown,
): ClinicalTrialMeta => {
  const lastUpdateDate = asString(getPath(protocol, ['statusModule', 'lastUpdatePostDateStruct', 'date']));
  const phases = asStringArray(getPath(protocol, ['designModule', 'phases']));
  const enrollmentType = getPath(protocol, ['designModule', 'enrollmentInfo', 'type']);
  return {
    nctId,
    title: asString(getPath(protocol, ['identificationModule', 'briefTitle'])),
    year: lastUpdateDate ? lastUpdateDate.split("-")[0] : null,
    url: `${CLINICAL_TRIALS_URL}/${nctId}`,
    startDate: asString(getPath(protocol, ['statusModule', 'startDateStruct', 'date'])),
    phases,
    phase: parsePhaseNumber(phases),
    status: asString(getPath(protocol, ['statusModule', 'overallStatus'])),
    enrollmentCount: asNumber(getPath(protocol, ['designModule', 'enrollmentInfo', 'count'])),
    enrollmentType: parseEnrollmentType(typeof enrollmentType === 'string' ? enrollmentType : undefined),
  };
};

const fetchClinicalTrialMetadata = async (nctId: string): Promise<ClinicalTrialMeta> => {
  const res = await fetch(
    `${CLINICAL_TRIALS_API}/${nctId}?format=json&fields=${encodeURIComponent(METADATA_FIELDS)}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch metadata for ${nctId}: ${res.status}`);
  }

  const data = await res.json();
  return parseClinicalTrialMetadata(nctId, data?.protocolSection);
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
    r.data ?? emptyClinicalTrialMeta(nctIds[i]),
  );

  return { trials, isLoading };
};

export default useClinicalTrialMetadata;
