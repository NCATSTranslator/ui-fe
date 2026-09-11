#!/usr/bin/env node
/**
 * Generates a Google Tag Manager container export from the analytics taxonomy.
 *
 *   node scripts/generate-gtm-container.mjs
 *
 * Output: analytics/gtm-container.json, importable via
 * GTM > Admin > Import Container (choose "Merge" > "Rename conflicting tags").
 *
 * src/features/Analytics/types/analytics.d.ts is the single source of truth.
 * Add an event there, re-run this, re-import: the tag, trigger, and dataLayer
 * variables for it are created automatically. Nothing here is hand-maintained,
 * so the container cannot drift from what the app actually pushes.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTaxonomy } from './lib/analyticsTaxonomy.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(ROOT, 'analytics/gtm-container.json');

/** Placeholder the importer replaces; also the name of the constant variable. */
const MEASUREMENT_ID_VAR = 'GA4 Measurement ID';
const MEASUREMENT_ID_PLACEHOLDER = 'G-XXXXXXXXXX';

/** GTM's built-in trigger for "Initialization - All Pages". */
const INITIALIZATION_TRIGGER_ID = '2147479573';

/** Page views are pushed by usePageViewTracking rather than by GA4 itself. */
const PAGE_VIEW_EVENT = 'spa_page_view';
const PAGE_VIEW_PARAMS = ['page_path', 'page_title', 'page_location'];

// ---------------------------------------------------------------------------
// Container assembly
// ---------------------------------------------------------------------------

const ACCOUNT_ID = '0';
const CONTAINER_ID = '0';

const ids = { variable: 0, trigger: 0, tag: 0 };
const nextId = kind => String(++ids[kind]);

const dataLayerVariable = paramName => ({
  accountId: ACCOUNT_ID,
  containerId: CONTAINER_ID,
  variableId: nextId('variable'),
  name: `DLV - ${paramName}`,
  type: 'v',
  parameter: [
    { type: 'INTEGER', key: 'dataLayerVersion', value: '2' },
    { type: 'BOOLEAN', key: 'setDefaultValue', value: 'false' },
    { type: 'TEMPLATE', key: 'name', value: paramName },
  ],
  fingerprint: '0',
  formatValue: {},
});

const constantVariable = (name, value) => ({
  accountId: ACCOUNT_ID,
  containerId: CONTAINER_ID,
  variableId: nextId('variable'),
  name,
  type: 'c',
  parameter: [{ type: 'TEMPLATE', key: 'value', value }],
  fingerprint: '0',
  formatValue: {},
});

const customEventTrigger = eventName => ({
  accountId: ACCOUNT_ID,
  containerId: CONTAINER_ID,
  triggerId: nextId('trigger'),
  name: `CE - ${eventName}`,
  type: 'CUSTOM_EVENT',
  customEventFilter: [
    {
      type: 'EQUALS',
      parameter: [
        { type: 'TEMPLATE', key: 'arg0', value: '{{_event}}' },
        { type: 'TEMPLATE', key: 'arg1', value: eventName },
      ],
    },
  ],
  fingerprint: '0',
});

/**
 * The Google tag. send_page_view is disabled on purpose: usePageViewTracking
 * fires a page_view on mount and on every route change, so leaving GA4's own
 * initial page view enabled would double count the landing page.
 */
const googleTag = () => ({
  accountId: ACCOUNT_ID,
  containerId: CONTAINER_ID,
  tagId: nextId('tag'),
  name: 'Google Tag - GA4',
  type: 'googtag',
  parameter: [
    { type: 'TEMPLATE', key: 'tagId', value: `{{${MEASUREMENT_ID_VAR}}}` },
    {
      type: 'LIST',
      key: 'configSettingsTable',
      list: [
        {
          type: 'MAP',
          map: [
            { type: 'TEMPLATE', key: 'parameter', value: 'send_page_view' },
            { type: 'TEMPLATE', key: 'parameterValue', value: 'false' },
          ],
        },
      ],
    },
  ],
  fingerprint: '0',
  firingTriggerId: [INITIALIZATION_TRIGGER_ID],
  tagFiringOption: 'ONCE_PER_EVENT',
  monitoringMetadata: { type: 'MAP' },
});

const ga4EventTag = (eventName, params, triggerId) => ({
  accountId: ACCOUNT_ID,
  containerId: CONTAINER_ID,
  tagId: nextId('tag'),
  name: `GA4 Event - ${eventName}`,
  type: 'gaawe',
  parameter: [
    { type: 'TEMPLATE', key: 'eventName', value: eventName },
    {
      type: 'LIST',
      key: 'eventSettingsTable',
      list: params.map(param => ({
        type: 'MAP',
        map: [
          { type: 'TEMPLATE', key: 'parameter', value: param },
          { type: 'TEMPLATE', key: 'parameterValue', value: `{{DLV - ${param}}}` },
        ],
      })),
    },
    { type: 'TEMPLATE', key: 'measurementIdOverride', value: `{{${MEASUREMENT_ID_VAR}}}` },
  ],
  fingerprint: '0',
  firingTriggerId: [triggerId],
  tagFiringOption: 'ONCE_PER_EVENT',
  monitoringMetadata: { type: 'MAP' },
});

const build = () => {
  const { events, dimensions, metrics } = loadTaxonomy();

  const usedParams = new Set(PAGE_VIEW_PARAMS);
  for (const event of events) for (const param of event.params) usedParams.add(param);

  const variables = [constantVariable(MEASUREMENT_ID_VAR, MEASUREMENT_ID_PLACEHOLDER)];
  for (const param of [...usedParams].sort()) variables.push(dataLayerVariable(param));

  const triggers = [];
  const tags = [googleTag()];

  const pageViewTrigger = customEventTrigger(PAGE_VIEW_EVENT);
  triggers.push(pageViewTrigger);
  tags.push(ga4EventTag('page_view', PAGE_VIEW_PARAMS, pageViewTrigger.triggerId));

  for (const event of [...events].sort((a, b) => a.name.localeCompare(b.name))) {
    const trigger = customEventTrigger(event.name);
    triggers.push(trigger);
    tags.push(ga4EventTag(event.name, event.params, trigger.triggerId));
  }

  return {
    container: {
      exportFormatVersion: 2,
      exportTime: new Date().toISOString(),
      containerVersion: {
        path: `accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/versions/0`,
        accountId: ACCOUNT_ID,
        containerId: CONTAINER_ID,
        containerVersionId: '0',
        name: 'Translator UI - generated',
        description:
          'Generated by scripts/generate-gtm-container.mjs from src/features/Analytics/types/analytics.d.ts. Do not hand-edit; regenerate and re-import.',
        container: {
          path: `accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}`,
          accountId: ACCOUNT_ID,
          containerId: CONTAINER_ID,
          name: 'Translator UI',
          publicId: 'GTM-XXXXXXX',
          usageContext: ['WEB'],
          fingerprint: '0',
        },
        tag: tags,
        trigger: triggers,
        variable: variables,
        fingerprint: '0',
      },
    },
    stats: {
      events: events.length,
      tags: tags.length,
      triggers: triggers.length,
      variables: variables.length,
      dimensions: dimensions.length,
      metrics: metrics.length,
    },
  };
};

/**
 * Carries the previous exportTime forward when nothing else in the container
 * changed, so regenerating from an unchanged taxonomy leaves the file untouched
 * instead of producing a timestamp-only diff.
 */
const withStableExportTime = container => {
  if (!existsSync(OUTPUT)) return container;
  try {
    const previous = JSON.parse(readFileSync(OUTPUT, 'utf8'));
    const withoutTime = c => JSON.stringify({ ...c, exportTime: undefined });
    if (withoutTime(previous) === withoutTime(container)) {
      return { ...container, exportTime: previous.exportTime };
    }
  } catch {
    // An unreadable previous export just gets a fresh timestamp.
  }
  return container;
};

const { container, stats } = build();
mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(withStableExportTime(container), null, 2)}\n`);

console.log(`Wrote ${OUTPUT}`);
console.log(
  `  ${stats.events} events -> ${stats.tags} tags, ${stats.triggers} triggers, ${stats.variables} variables`
);
console.log(`  ${stats.dimensions} custom dimensions, ${stats.metrics} custom metrics declared`);
