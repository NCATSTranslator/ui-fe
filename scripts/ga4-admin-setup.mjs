#!/usr/bin/env node
/**
 * Registers this app's custom dimensions, custom metrics, and key events on a
 * GA4 property, using the Analytics Admin API.
 *
 * GA4 has no import format for these; the UI is the only alternative and it is
 * roughly fifty separate forms. Definitions come from the same taxonomy the app
 * and the GTM container are built from.
 *
 * Usage:
 *   export GA4_PROPERTY_ID=123456789          # Admin > Property Settings
 *   export GA4_ACCESS_TOKEN="$(gcloud auth print-access-token \
 *     --scopes=https://www.googleapis.com/auth/analytics.edit)"
 *   node scripts/ga4-admin-setup.mjs --dry-run   # show the plan
 *   node scripts/ga4-admin-setup.mjs             # apply it
 *
 * The account behind the token needs Editor or Administrator on the property.
 *
 * Safe to re-run: existing definitions are listed first and matching ones are
 * skipped, so this converges rather than duplicating.
 */

import { loadTaxonomy, toDisplayName } from './lib/analyticsTaxonomy.mjs';

const API_ROOT = 'https://analyticsadmin.googleapis.com/v1beta';

/** GA4 caps event-scoped custom dimensions and metrics at 50 each. */
const MAX_CUSTOM_DIMENSIONS = 50;
const MAX_CUSTOM_METRICS = 50;

/**
 * Events worth marking as key events (what GA4 used to call conversions).
 * Deliberately short: every key event competes for attention in the reports,
 * and these are the five that represent a user getting real value out of a
 * session rather than merely moving around in it.
 */
const KEY_EVENTS = [
  'query_submitted',
  'results_downloaded',
  'canvas_created',
  'share_link_copied',
  'project_created',
];

const dryRun = process.argv.includes('--dry-run');
const propertyId = process.env.GA4_PROPERTY_ID;
const accessToken = process.env.GA4_ACCESS_TOKEN;

const fail = message => {
  console.error(`error: ${message}`);
  process.exit(1);
};

if (!propertyId) fail('GA4_PROPERTY_ID is not set');
if (!dryRun && !accessToken) fail('GA4_ACCESS_TOKEN is not set (or pass --dry-run)');
if (!/^\d+$/.test(propertyId)) {
  fail(`GA4_PROPERTY_ID must be the numeric property ID, got "${propertyId}"`);
}

const request = async (method, path, body) => {
  const response = await fetch(`${API_ROOT}/properties/${propertyId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : {};
};

/** Pages through a list endpoint and returns every item. */
const listAll = async (path, key) => {
  const items = [];
  let pageToken;
  do {
    const query = pageToken ? `?pageSize=200&pageToken=${encodeURIComponent(pageToken)}` : '?pageSize=200';
    const page = await request('GET', `${path}${query}`);
    items.push(...(page[key] ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return items;
};

const summary = { created: 0, skipped: 0, failed: 0 };

/**
 * Creates one resource unless an equivalent already exists.
 * `identity` is the field that makes two definitions the same thing.
 */
const ensure = async ({ label, path, identity, existing, payload }) => {
  const value = payload[identity];
  if (existing.some(item => item[identity] === value)) {
    console.log(`  skip    ${label} ${value} (already exists)`);
    summary.skipped++;
    return;
  }

  if (dryRun) {
    console.log(`  create  ${label} ${value}`);
    summary.created++;
    return;
  }

  try {
    await request('POST', path, payload);
    console.log(`  created ${label} ${value}`);
    summary.created++;
  } catch (error) {
    console.error(`  FAILED  ${label} ${value}: ${error.message}`);
    summary.failed++;
  }
};

const main = async () => {
  const { events, dimensions, metrics } = loadTaxonomy();

  console.log(
    `${dryRun ? 'Planning' : 'Applying'} GA4 setup for property ${propertyId}`
  );
  console.log(
    `Taxonomy: ${events.length} events, ${dimensions.length} dimensions, ${metrics.length} metrics\n`
  );

  if (dimensions.length > MAX_CUSTOM_DIMENSIONS) {
    fail(`${dimensions.length} custom dimensions exceeds the GA4 limit of ${MAX_CUSTOM_DIMENSIONS}`);
  }
  if (metrics.length > MAX_CUSTOM_METRICS) {
    fail(`${metrics.length} custom metrics exceeds the GA4 limit of ${MAX_CUSTOM_METRICS}`);
  }

  const missingKeyEvents = KEY_EVENTS.filter(name => !events.some(e => e.name === name));
  if (missingKeyEvents.length) {
    fail(`KEY_EVENTS names no longer in the taxonomy: ${missingKeyEvents.join(', ')}`);
  }

  // Without a token we cannot list, so a dry run just plans against nothing.
  const [existingDimensions, existingMetrics, existingKeyEvents] = accessToken
    ? await Promise.all([
        listAll('/customDimensions', 'customDimensions'),
        listAll('/customMetrics', 'customMetrics'),
        listAll('/keyEvents', 'keyEvents'),
      ])
    : [[], [], []];

  console.log('Custom dimensions');
  for (const parameterName of dimensions) {
    await ensure({
      label: 'dimension',
      path: '/customDimensions',
      identity: 'parameterName',
      existing: existingDimensions,
      payload: {
        parameterName,
        displayName: toDisplayName(parameterName),
        description: `Set by the Translator UI on events that carry ${parameterName}.`,
        scope: 'EVENT',
      },
    });
  }

  console.log('\nCustom metrics');
  for (const parameterName of metrics) {
    await ensure({
      label: 'metric',
      path: '/customMetrics',
      identity: 'parameterName',
      existing: existingMetrics,
      payload: {
        parameterName,
        displayName: toDisplayName(parameterName),
        description: `Set by the Translator UI on events that carry ${parameterName}.`,
        scope: 'EVENT',
        // load_ms is the one true duration; everything else is a plain count.
        measurementUnit: parameterName.endsWith('_ms') ? 'MILLISECONDS' : 'STANDARD',
      },
    });
  }

  console.log('\nKey events');
  for (const eventName of KEY_EVENTS) {
    await ensure({
      label: 'key event',
      path: '/keyEvents',
      identity: 'eventName',
      existing: existingKeyEvents,
      payload: { eventName, countingMethod: 'ONCE_PER_EVENT' },
    });
  }

  console.log(
    `\n${dryRun ? 'Would create' : 'Created'} ${summary.created}, skipped ${summary.skipped}, failed ${summary.failed}`
  );

  if (dryRun) {
    console.log('\nDry run only. Re-run without --dry-run to apply.');
  } else {
    console.log(
      '\nCustom event names themselves cannot be pre-registered: GA4 creates them\n' +
      'when the first hit arrives, and they can take up to 24h to appear in reports.'
    );
  }

  if (summary.failed > 0) process.exit(1);
};

main().catch(error => fail(error.message));
