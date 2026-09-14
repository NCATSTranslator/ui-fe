/**
 * Parses src/features/Analytics/types/analytics.d.ts.
 *
 * The TypeScript taxonomy is the single source of truth for both the GTM
 * container and the GA4 property configuration, so neither generator hardcodes
 * an event or parameter list that could fall out of step with the app.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const TAXONOMY_PATH = resolve(ROOT, 'src/features/Analytics/types/analytics.d.ts');

/** Returns the source between the braces of `declaration { ... }`. */
const extractBlock = (source, declaration) => {
  const start = source.indexOf(declaration);
  if (start === -1) throw new Error(`Could not find "${declaration}" in the taxonomy`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`Unbalanced braces after "${declaration}"`);
};

/** Returns the string literal members of a `type X = 'a' | 'b';` union. */
const extractUnionMembers = (source, typeName) => {
  const match = new RegExp(`export type ${typeName} =([\\s\\S]*?);`).exec(source);
  if (!match) throw new Error(`Could not find union type ${typeName}`);
  return [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
};

const stripComments = source =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/**
 * Parses AnalyticsEventMap into [{ name, params }]. Handles both the
 * `event: { a: X; b?: Y };` and `event: Record<string, never>;` forms.
 */
const parseEventMap = source => {
  const body = stripComments(extractBlock(source, 'export interface AnalyticsEventMap'));
  const events = [];
  let i = 0;

  while (i < body.length) {
    const header = /^\s*([a-z][a-z0-9_]*)\s*:\s*/.exec(body.slice(i));
    if (!header) {
      const next = body.indexOf(';', i);
      if (next === -1) break;
      i = next + 1;
      continue;
    }

    const name = header[1];
    const cursor = i + header[0].length;

    if (body[cursor] === '{') {
      let depth = 0;
      let end = cursor;
      for (; end < body.length; end++) {
        if (body[end] === '{') depth++;
        else if (body[end] === '}') {
          depth--;
          if (depth === 0) break;
        }
      }
      const inner = body.slice(cursor + 1, end);
      events.push({
        name,
        params: [...inner.matchAll(/([a-z][a-z0-9_]*)\s*\??\s*:/g)].map(m => m[1]),
      });
      i = body.indexOf(';', end) + 1;
    } else {
      // Record<string, never> and friends: an event with no parameters.
      events.push({ name, params: [] });
      i = body.indexOf(';', cursor) + 1;
    }
  }

  return events;
};

/** Reads and parses the taxonomy. */
export const loadTaxonomy = () => {
  const source = readFileSync(TAXONOMY_PATH, 'utf8');
  const events = parseEventMap(source);
  const dimensions = extractUnionMembers(source, 'AnalyticsDimension');
  const metrics = extractUnionMembers(source, 'AnalyticsMetric');

  if (events.length === 0) throw new Error('Parsed zero events from the taxonomy');

  const usedParams = new Set();
  for (const event of events) for (const param of event.params) usedParams.add(param);

  const unknown = [...usedParams].filter(p => !dimensions.includes(p) && !metrics.includes(p));
  if (unknown.length) {
    throw new Error(
      `These event parameters are not declared as a dimension or metric: ${unknown.join(', ')}`
    );
  }

  // Only register what events actually send; an unused union member would
  // otherwise burn one of GA4's 50 custom dimension slots for nothing.
  return {
    events,
    dimensions: dimensions.filter(d => usedParams.has(d)),
    metrics: metrics.filter(m => usedParams.has(m)),
    allDimensions: dimensions,
    allMetrics: metrics,
  };
};

/** Turns snake_case into the Title Case GA4 shows in report pickers. */
export const toDisplayName = param =>
  param.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
