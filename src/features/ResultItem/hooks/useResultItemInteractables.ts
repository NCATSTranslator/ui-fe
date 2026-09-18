import { ReactNode } from 'react';

export interface SummaryState {
  content: ReactNode | null;
  hasCached: boolean;
}

export const createStorageKey = (resultId: string): string => `resultSummary_${resultId}`;
export const sanitizeNameString = (nameString: string): string => nameString.replaceAll("'", "");
