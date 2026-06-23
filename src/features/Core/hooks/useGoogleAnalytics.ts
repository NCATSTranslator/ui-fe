import { useEffect } from 'react';

const GA_ID_REGEX = /^G-[A-Z0-9]{10}$/;
const isValidGAID = (gaID: string): boolean => {
  return GA_ID_REGEX.test(gaID);
};

export const useGoogleAnalytics = (gaID: string | undefined): void => {
  useEffect(() => {
    if (!gaID || !isValidGAID(gaID)) return;

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaID}`;

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaID}');
    `;

    document.head.appendChild(script1);
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [gaID]);
};
