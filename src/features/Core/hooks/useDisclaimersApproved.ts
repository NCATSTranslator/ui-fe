import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export const useDisclaimersApproved = (title: string): [boolean, Dispatch<SetStateAction<boolean>>] => {
  const [isDisclaimerApproved, setIsDisclaimerApproved] = useState<boolean>(false);

  useEffect(() => {
    const rawDisclaimer = localStorage.getItem('disclaimerApproved');
    const disclaimerApproved = rawDisclaimer ? JSON.parse(rawDisclaimer) : false;

    const loginDisclaimerRaw = localStorage.getItem('loginDisclaimerApproved');
    let initDisclaimerApproval = disclaimerApproved;

    if (window.location.pathname.includes('login') && loginDisclaimerRaw) {
      try {
        const { approved, timestamp } = JSON.parse(loginDisclaimerRaw);
        const oneYear = 365 * 24 * 60 * 60 * 1000;
        const isOlderThanOneYear = Date.now() - timestamp > oneYear;

        if (isOlderThanOneYear) {
          localStorage.removeItem('loginDisclaimerApproved');
          initDisclaimerApproval = false;
        } else {
          initDisclaimerApproval = approved;
        }
      } catch {
        initDisclaimerApproval = false;
      }
    }

    setIsDisclaimerApproved(initDisclaimerApproval);
  }, [title]);

  return [isDisclaimerApproved, setIsDisclaimerApproved];
};
