import type {
  AnalyticsEventName,
  AnalyticsEventMap,
  AnalyticsParams,
  DataLayerPush,
  LinkType,
} from '@/features/Analytics/types/analytics';
import { createDebugToggle } from '@/features/Core/utils/debugToggle';

/** GA4 truncates string parameter values beyond this length; do it here so reports match what we log. */
const MAX_PARAM_VALUE_LENGTH = 100;
/** GA4 drops events carrying more than this many parameters. */
const MAX_PARAMS_PER_EVENT = 25;

// Off under Vitest, which also runs with DEV set and would log every tracked
// interaction into test output. Exposed as window.__analyticsDebug.
const analyticsDebug = createDebugToggle('__analyticsDebug', import.meta.env.DEV && import.meta.env.MODE !== 'test');

/**
 * Turn dataLayer console logging on or off at runtime. Defaults to on in dev.
 */
export const setAnalyticsDebug = analyticsDebug.set;

/**
 * Returns the GTM dataLayer, creating it if GTM has not loaded yet.
 *
 * Pushing before the container script arrives is safe and intentional: GTM
 * replays anything already in the array once it initializes, so events fired
 * during app bootstrap are not lost.
 *
 * Returns null outside a browser (tests, SSR) so callers can no-op.
 */
export const getDataLayer = (): Record<string, unknown>[] | null => {
  if (typeof window === 'undefined') return null;
  if (!window.dataLayer) window.dataLayer = [];
  return window.dataLayer;
};

/**
 * Which product is actually carrying events to GA4.
 *
 *  - `gtm`     a container is configured and owns the GA4 tag
 *  - `gtag`    no container; gtag.js is loaded from the backend's gaID
 *  - `none`    neither is configured; events stay in the dataLayer
 *  - `pending` config has not resolved yet
 */
export type AnalyticsTransport = 'pending' | 'gtm' | 'gtag' | 'none';

type GtagFn = (...args: unknown[]) => void;

let transport: AnalyticsTransport = 'pending';

/**
 * Events fired before the backend config resolved.
 *
 * The plain dataLayer push always happens immediately, which is all GTM needs
 * because it replays the array on load. gtag.js does not: it only understands
 * the `arguments` objects the gtag() shim pushes. So events raised during
 * bootstrap - the first page view above all - are held here and forwarded once
 * we know gtag is the transport. Bounded, because a config fetch that never
 * resolves must not grow this without limit.
 */
const pendingBridgeEvents: { name: string; params: Record<string, string | number> }[] = [];
const MAX_PENDING_BRIDGE_EVENTS = 50;

/**
 * Returns the gtag shim, installing it if gtag.js has not landed yet.
 *
 * The shim is the same one Google's own snippet installs: push `arguments` onto
 * the dataLayer. gtag.js processes whatever it finds there when it loads, so
 * installing this early makes the bridge independent of script load order.
 *
 * Declared with `function` rather than an arrow because it needs `arguments`.
 */
const ensureGtag = (): GtagFn | null => {
  if (typeof window === 'undefined') return null;
  const globalWindow = window as unknown as { gtag?: GtagFn };

  if (typeof globalWindow.gtag !== 'function') {
    globalWindow.gtag = function gtag() {
      getDataLayer()?.push(arguments as unknown as Record<string, unknown>);
    } as GtagFn;
  }

  return globalWindow.gtag ?? null;
};

const sendViaGtag = (eventName: string, params: Record<string, string | number>): void => {
  const gtag = ensureGtag();
  if (!gtag) return;
  gtag('event', eventName, params);
};

/** Routes one event to gtag.js, or holds it until the transport is known. */
const bridgeToGtag = (eventName: string, params: Record<string, string | number>): void => {
  if (transport === 'gtag') {
    sendViaGtag(eventName, params);
    return;
  }

  // Under GTM the plain dataLayer push is already the delivery mechanism, and
  // sending through gtag as well would double count every event.
  if (transport !== 'pending') return;

  if (pendingBridgeEvents.length >= MAX_PENDING_BRIDGE_EVENTS) return;
  pendingBridgeEvents.push({ name: eventName, params });
};

/**
 * Declares how events reach GA4. Called once the backend config resolves.
 *
 * Switching to `gtag` flushes anything buffered during bootstrap; any other
 * value discards the buffer, since GTM replays the dataLayer itself and the
 * remaining cases have nowhere to send.
 */
export const setAnalyticsTransport = (next: AnalyticsTransport): void => {
  transport = next;

  if (next === 'gtag') {
    for (const event of pendingBridgeEvents) sendViaGtag(event.name, event.params);
  }

  pendingBridgeEvents.length = 0;
};

/** The current transport. Exported for tests and debugging. */
export const getAnalyticsTransport = (): AnalyticsTransport => transport;

/** Clamp a string to GA4's parameter value limit. */
const truncate = (value: string): string =>
  value.length > MAX_PARAM_VALUE_LENGTH ? value.slice(0, MAX_PARAM_VALUE_LENGTH) : value;

/**
 * Strip parameters GA4 would reject or that carry no signal: undefined, null,
 * empty strings, and NaN/Infinity numbers. Truncates long strings and caps the
 * parameter count.
 */
export const sanitizeParams = (params: AnalyticsParams | undefined): Record<string, string | number> => {
  if (!params) return {};

  const cleaned: Record<string, string | number> = {};
  let count = 0;

  for (const [key, value] of Object.entries(params)) {
    if (count >= MAX_PARAMS_PER_EVENT) break;
    if (value === undefined || value === null) continue;

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) continue;
      cleaned[key] = value;
      count++;
    } else if (typeof value === 'string') {
      if (value.length === 0) continue;
      cleaned[key] = truncate(value);
      count++;
    }
  }

  return cleaned;
};

/**
 * Push a single event onto the dataLayer. All tracking funnels through here.
 *
 * The push is wrapped in try/catch because analytics must never be able to
 * break a user interaction: a third-party script that has replaced dataLayer
 * with something exotic should cost us a console warning, not a crash.
 */
export const pushToDataLayer = (payload: DataLayerPush): void => {
  const layer = getDataLayer();
  if (!layer) return;

  try {
    layer.push(payload);
    if (analyticsDebug.isEnabled()) console.debug('[analytics]', payload.event, payload);
  } catch (error) {
    console.warn('[analytics] dataLayer push failed', error);
  }
};

/**
 * Track a product event. The parameter shape is checked against the taxonomy in
 * types/analytics.d.ts, so a typo in a parameter name is a compile error rather
 * than a silently missing dimension in GA4.
 */
export const trackEvent = <K extends AnalyticsEventName>(
  name: K,
  params?: AnalyticsEventMap[K],
): void => {
  const cleaned = sanitizeParams(params as AnalyticsParams | undefined);
  pushToDataLayer({ event: name, ...cleaned });
  bridgeToGtag(name, cleaned);
};

/** Push an SPA page view. Route-change tracking uses this; see usePageViewTracking. */
export const trackPageView = (path: string, title: string): void => {
  const params = {
    page_path: truncate(path),
    page_title: truncate(title),
    page_location: typeof window !== 'undefined' ? truncate(window.location.href) : '',
  };

  pushToDataLayer({ event: 'spa_page_view', ...params });
  // GTM turns spa_page_view into a GA4 page_view via its trigger; on the gtag
  // path there is no container to do that renaming, so send the real name.
  bridgeToGtag('page_view', params);
};

/** Best-effort hostname for an outbound link, used as a low-cardinality dimension. */
export const getLinkDomain = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined).hostname;
  } catch {
    return undefined;
  }
};

/**
 * Track a click on an outbound evidence link.
 *
 * Only the hostname is recorded: full URLs are unbounded cardinality, and
 * "which sources do people actually follow" is answered by the domain.
 * Attached as an onClick so the navigation itself is untouched — the dataLayer
 * push is synchronous and completes before the new tab takes over.
 */
export const trackEvidenceLink = (linkType: LinkType, url: string | undefined): void => {
  trackEvent('evidence_link_clicked', {
    link_type: linkType,
    link_domain: getLinkDomain(url),
  });
};
