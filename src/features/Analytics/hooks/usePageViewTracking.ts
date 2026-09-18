import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/features/Analytics/utils/dataLayer';

/**
 * Sends a page view on mount and on every React Router navigation.
 *
 * gtag's `config` call only fires once, when the SPA bootstraps, so without
 * this every route after the landing page is invisible. GA4 enhanced
 * measurement can catch history events on its own, but it reads
 * `document.title` at the moment of the history change — before React has
 * committed the new route's title — so the hit is attributed to the previous
 * page. Firing after paint, from the router's own location, avoids that.
 *
 * The GA4 tag in the GTM container has send_page_view disabled precisely so
 * this is the single source of page views and nothing is double counted.
 */
export const usePageViewTracking = (): void => {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;

    // Defer a frame so route components have committed their document.title.
    // Cancelling in cleanup also absorbs StrictMode's double-invoked effect:
    // the first run's frame never fires, so each navigation reports once.
    const id = window.requestAnimationFrame(() => {
      trackPageView(path, document.title);
    });

    return () => window.cancelAnimationFrame(id);
  }, [location.pathname, location.search, location.hash]);
};

export default usePageViewTracking;
