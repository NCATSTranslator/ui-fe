import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getDataLayer,
  sanitizeParams,
  pushToDataLayer,
  trackEvent,
  trackPageView,
  trackEvidenceLink,
  getLinkDomain,
  setAnalyticsDebug,
  setAnalyticsTransport,
  getAnalyticsTransport,
} from './dataLayer';

const layer = () => window.dataLayer ?? [];

/** gtag pushes an arguments object; these are the entries gtag.js would read. */
const gtagCalls = () =>
  layer()
    .filter(entry => typeof entry === 'object' && entry !== null && entry[0] === 'event')
    .map(entry => [entry[0], entry[1], entry[2]]);

describe('analytics dataLayer', () => {
  beforeEach(() => {
    window.dataLayer = [];
    delete (window as unknown as { gtag?: unknown }).gtag;
    setAnalyticsDebug(false);
    setAnalyticsTransport('pending');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDataLayer', () => {
    it('creates the array when GTM has not loaded yet', () => {
      delete window.dataLayer;
      expect(getDataLayer()).toEqual([]);
      expect(window.dataLayer).toBeDefined();
    });

    it('reuses the array GTM already installed', () => {
      const existing = [{ event: 'gtm.js' }];
      window.dataLayer = existing;
      expect(getDataLayer()).toBe(existing);
    });
  });

  describe('sanitizeParams', () => {
    it('drops undefined, null, and empty string values', () => {
      expect(
        sanitizeParams({
          query_type: 'single',
          subject_category: undefined,
          error_message: '',
        })
      ).toEqual({ query_type: 'single' });
    });

    it('keeps zero, which is a real metric value', () => {
      expect(sanitizeParams({ result_count: 0 })).toEqual({ result_count: 0 });
    });

    it('drops non-finite numbers GA4 would reject', () => {
      expect(sanitizeParams({ load_ms: NaN, result_count: Infinity })).toEqual({});
    });

    it('truncates strings to the 100 character GA4 limit', () => {
      const long = 'x'.repeat(250);
      const result = sanitizeParams({ filter_value: long });
      expect(result.filter_value as string).toHaveLength(100);
    });

    it('caps the parameter count at 25', () => {
      const params = Object.fromEntries(
        Array.from({ length: 40 }, (_, i) => [`p${i}`, 'v'])
      );
      expect(Object.keys(sanitizeParams(params as never))).toHaveLength(25);
    });

    it('returns an empty object for undefined params', () => {
      expect(sanitizeParams(undefined)).toEqual({});
    });
  });

  describe('trackEvent', () => {
    it('pushes the event name alongside its parameters', () => {
      trackEvent('query_submitted', { query_type: 'pathfinder', subject_category: 'Gene' });
      expect(layer()).toEqual([
        { event: 'query_submitted', query_type: 'pathfinder', subject_category: 'Gene' },
      ]);
    });

    it('pushes a bare event when there are no parameters', () => {
      trackEvent('canvas_created');
      expect(layer()).toEqual([{ event: 'canvas_created' }]);
    });

    it('never throws when the dataLayer rejects a push', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      window.dataLayer = {
        push: () => {
          throw new Error('hijacked by another tag');
        },
      } as unknown as Record<string, unknown>[];

      expect(() => trackEvent('canvas_created')).not.toThrow();
      expect(warn).toHaveBeenCalled();
    });
  });

  describe('trackPageView', () => {
    it('records the router path rather than only the document location', () => {
      trackPageView('/results?q=1', 'Results');
      expect(layer()[0]).toMatchObject({
        event: 'spa_page_view',
        page_path: '/results?q=1',
        page_title: 'Results',
      });
    });
  });

  describe('getLinkDomain', () => {
    it('reduces a URL to its hostname', () => {
      expect(getLinkDomain('https://pubmed.ncbi.nlm.nih.gov/12345/')).toBe('pubmed.ncbi.nlm.nih.gov');
    });

    it('returns undefined when there is no URL at all', () => {
      expect(getLinkDomain(undefined)).toBeUndefined();
      expect(getLinkDomain('')).toBeUndefined();
    });

    it('resolves a relative href against the app origin', () => {
      // Relative hrefs are in-app links; reporting them as our own host is
      // correct and keeps them distinguishable from third-party sources.
      expect(getLinkDomain('/articles/help')).toBe('localhost');
    });
  });

  describe('trackEvidenceLink', () => {
    it('records the domain and not the full URL', () => {
      trackEvidenceLink('publication', 'https://pubmed.ncbi.nlm.nih.gov/12345/?utm=x');
      expect(layer()[0]).toEqual({
        event: 'evidence_link_clicked',
        link_type: 'publication',
        link_domain: 'pubmed.ncbi.nlm.nih.gov',
      });
    });
  });

  describe('pushToDataLayer', () => {
    it('logs when debug is enabled and stays quiet otherwise', () => {
      const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});

      pushToDataLayer({ event: 'canvas_created' });
      expect(debug).not.toHaveBeenCalled();

      setAnalyticsDebug(true);
      pushToDataLayer({ event: 'canvas_created' });
      expect(debug).toHaveBeenCalledOnce();
    });
  });

  describe('gtag bridge', () => {
    it('starts pending so nothing is assumed about the transport', () => {
      expect(getAnalyticsTransport()).toBe('pending');
    });

    it('forwards events to gtag once gtag is the transport', () => {
      setAnalyticsTransport('gtag');
      trackEvent('share_link_copied', { share_scope: 'result' });

      expect(gtagCalls()).toEqual([['event', 'share_link_copied', { share_scope: 'result' }]]);
    });

    it('replays events buffered before the config resolved', () => {
      trackEvent('query_submitted', { query_type: 'single' });
      trackPageView('/results', 'Results');
      expect(gtagCalls()).toEqual([]);

      setAnalyticsTransport('gtag');

      expect(gtagCalls()).toEqual([
        ['event', 'query_submitted', { query_type: 'single' }],
        [
          'event',
          'page_view',
          { page_path: '/results', page_title: 'Results', page_location: expect.any(String) },
        ],
      ]);
    });

    it('sends page views under GA4\'s own event name, not the transport name', () => {
      setAnalyticsTransport('gtag');
      trackPageView('/', 'Home');

      expect(layer()[0]).toMatchObject({ event: 'spa_page_view' });
      expect(gtagCalls()[0][1]).toBe('page_view');
    });

    it('does not bridge under GTM, which would double count', () => {
      trackEvent('canvas_created');
      setAnalyticsTransport('gtm');
      trackEvent('project_created');

      expect(gtagCalls()).toEqual([]);
      expect(layer().map(e => e.event)).toEqual(['canvas_created', 'project_created']);
    });

    it('discards the buffer when no transport is configured', () => {
      trackEvent('canvas_created');
      setAnalyticsTransport('none');
      setAnalyticsTransport('gtag');

      expect(gtagCalls()).toEqual([]);
    });

    it('caps the pre-config buffer so a stalled config cannot grow it forever', () => {
      for (let i = 0; i < 120; i++) trackEvent('canvas_created');
      setAnalyticsTransport('gtag');

      expect(gtagCalls()).toHaveLength(50);
    });

    it('reuses the gtag shim gtag.js already installed', () => {
      const existing = vi.fn();
      (window as unknown as { gtag?: unknown }).gtag = existing;

      setAnalyticsTransport('gtag');
      trackEvent('canvas_created');

      expect(existing).toHaveBeenCalledWith('event', 'canvas_created', {});
    });
  });
});
