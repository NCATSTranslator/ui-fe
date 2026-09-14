import { useEffect } from 'react';
import { setAnalyticsTransport } from '@/features/Analytics/utils/dataLayer';

/**
 * Tells the analytics layer how events reach GA4, once the backend config has
 * resolved.
 *
 * A GTM container, when one is configured, owns the GA4 tag and receives events
 * from the dataLayer directly. Otherwise gtag.js is loaded from the property's
 * measurement ID and events are bridged to it. The three deployed environments
 * each supply their own gaID, so the same build resolves to whichever property
 * the backend points it at.
 *
 * Neither ID present is left as `pending` rather than resolved to `none`: it is
 * indistinguishable from a config request still in flight, and the bridge
 * buffer is bounded, so waiting costs nothing and a slow config still delivers
 * the events raised during bootstrap.
 */
export const useAnalyticsTransport = (gaID: string | undefined, gtmID: string | undefined): void => {
  useEffect(() => {
    if (gtmID) setAnalyticsTransport('gtm');
    else if (gaID) setAnalyticsTransport('gtag');
  }, [gaID, gtmID]);
};

export default useAnalyticsTransport;
