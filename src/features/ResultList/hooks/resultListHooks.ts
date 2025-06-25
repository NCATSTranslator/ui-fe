import { Dispatch, SetStateAction, useEffect, useState } from "react";

/**
 * Returns the current New Results Available disclaimer status and a setter
 * that also updates localStorage.
 *
 * @param {boolean} visible - Whether the disclaimer tooltip is visible.
 * @returns {[boolean, Dispatch<SetStateAction<boolean>>]} - The disclaimer approval status and a setter.
 */
export const useNewResultsDisclaimerApproved = (
  visible: boolean
): [boolean, Dispatch<SetStateAction<boolean>>] => {
  const STORAGE_KEY = 'newResultsDisclaimerApproved';

  const [isNewResultsDisclaimerApproved, setIsNewResultsDisclaimerApproved] = useState<boolean>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : false;
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : false;
    setIsNewResultsDisclaimerApproved(stored);
  }, [visible]);

  const setAndPersistNewResultsDisclaimerApproved: Dispatch<SetStateAction<boolean>> = (value) => {
    setIsNewResultsDisclaimerApproved((prev) => {
      const next = typeof value === 'function' ? (value as (prev: boolean) => boolean)(prev) : value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return [isNewResultsDisclaimerApproved, setAndPersistNewResultsDisclaimerApproved];
};  