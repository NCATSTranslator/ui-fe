import { useEffect } from 'react';

const GA_ID_REGEX = /^G-[A-Z0-9]{10}$/;
export const isValidGAID = (gaID: string): boolean => {
  return GA_ID_REGEX.test(gaID);
};

/**
 * Injects gtag.js directly.
 *
 * This is the fallback transport. When a GTM container is configured it owns the
 * GA4 tag, so loading gtag here as well would double count every page view and
 * every event; pass `gtmActive` to suppress it in that case.
 *
 * send_page_view is disabled because usePageViewTracking sends a page view on
 * mount and on every route change. Leaving it on would count the landing page
 * twice, and would attribute it before React committed the route's title.
 *
 * @param gaID - GA4 measurement ID (G-XXXXXXXXXX).
 * @param gtmActive - True when a GTM container is loading GA4 instead.
 */
export const useGoogleAnalytics = (gaID: string | undefined, gtmActive: boolean = false): void => {
  useEffect(() => {
    if (gtmActive) return;
    if (!gaID || !isValidGAID(gaID)) return;

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaID}`;

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaID}', { send_page_view: false });
    `;

    document.head.appendChild(script1);
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [gaID, gtmActive]);
};
