import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@/features/UserAuth/utils/userApi';
import { useUpdateQueryLastSeen, useCopyQuery } from '@/features/Projects/hooks/customHooks';

/**
 * Records that the user has seen a query's results: touches last_seen on their
 * saved copy, or copies the query into their account if they have no copy yet.
 *
 * @param currentQueryID - The query being viewed
 * @param sid - The save ID of the user's copy of the query, if one exists
 * @param areUserQueriesLoaded - Whether the user's queries have loaded, so a missing sid means "not saved" rather than "unknown"
 * @returns markQuerySeen - Call once per results fetch
 */
export const useQuerySeen = (
  currentQueryID: string | null,
  sid: number | undefined,
  areUserQueriesLoaded: boolean,
): (() => void) => {
  const [user] = useUser();
  const { mutate: touchQueryLastSeen } = useUpdateQueryLastSeen(sid);
  const { mutate: copyQueryMutate } = useCopyQuery();

  // A new object per results fetch, so each fetch is handled exactly once by the effect below
  const [seenResults, setSeenResults] = useState<{ queryID: string } | null>(null);
  const handledSeenResults = useRef<{ queryID: string } | null>(null);
  const copiedQueryID = useRef<string | null>(null);

  // Deferred until the user's queries have loaded; otherwise an unloaded list looks
  // like an unsaved query and triggers a duplicate copy
  useEffect(() => {
    if (!user || !areUserQueriesLoaded || !seenResults)
      return;
    if (seenResults === handledSeenResults.current || seenResults.queryID !== currentQueryID)
      return;
    handledSeenResults.current = seenResults;

    if (sid !== undefined) {
      touchQueryLastSeen();
    } else if (copiedQueryID.current !== seenResults.queryID) {
      copiedQueryID.current = seenResults.queryID;
      copyQueryMutate(seenResults.queryID);
    }
  }, [user, areUserQueriesLoaded, seenResults, currentQueryID, sid, touchQueryLastSeen, copyQueryMutate]);

  return useCallback(() => {
    if (currentQueryID) setSeenResults({ queryID: currentQueryID });
  }, [currentQueryID]);
};
