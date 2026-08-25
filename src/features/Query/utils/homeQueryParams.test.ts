import { describe, it, expect } from 'vitest';
import {
  getHomeQueryPath,
  getQueryActionsForNodeCategory,
  HOME_QUERY_TAB_PARAM,
  HOME_QUERY_NODE_ID_PARAM,
  HOME_QUERY_NODE_LABEL_PARAM,
  HOME_QUERY_NODE_CATEGORY_PARAM,
} from './homeQueryParams';

describe('getHomeQueryPath', () => {
  it('includes tab and node id', () => {
    const path = getHomeQueryPath('smart', 'MONDO:0001');
    const params = new URLSearchParams(path.slice(2));
    expect(params.get(HOME_QUERY_TAB_PARAM)).toBe('smart');
    expect(params.get(HOME_QUERY_NODE_ID_PARAM)).toBe('MONDO:0001');
    expect(params.has(HOME_QUERY_NODE_LABEL_PARAM)).toBe(false);
    expect(params.has(HOME_QUERY_NODE_CATEGORY_PARAM)).toBe(false);
  });

  it('includes label when provided', () => {
    const path = getHomeQueryPath('lookup', 'NCBIGene:7157', 'TP53');
    const params = new URLSearchParams(path.slice(2));
    expect(params.get(HOME_QUERY_NODE_LABEL_PARAM)).toBe('TP53');
    expect(params.has(HOME_QUERY_NODE_CATEGORY_PARAM)).toBe(false);
  });

  it('includes nc when a category is provided', () => {
    const path = getHomeQueryPath('pathfinder', 'NCBIGene:7157', 'TP53', 'biolink:Gene');
    const params = new URLSearchParams(path.slice(2));
    expect(params.get(HOME_QUERY_NODE_CATEGORY_PARAM)).toBe('biolink:Gene');
  });

  it('omits nc when category is undefined', () => {
    const path = getHomeQueryPath('smart', 'MONDO:0001', 'Diabetes', undefined);
    const params = new URLSearchParams(path.slice(2));
    expect(params.has(HOME_QUERY_NODE_CATEGORY_PARAM)).toBe(false);
  });
});

describe('getQueryActionsForNodeCategory', () => {
  const allTabsEnabled = { includePathfinder: true, includeLookup: true };

  it('includes smart for supported categories', () => {
    const actions = getQueryActionsForNodeCategory(allTabsEnabled, 'biolink:Gene');
    expect(actions.map((action) => action.action)).toEqual(['smart', 'pathfinder', 'lookup']);
  });

  it('excludes smart for unsupported categories', () => {
    const actions = getQueryActionsForNodeCategory(allTabsEnabled, 'biolink:AnatomicalEntity');
    expect(actions.map((action) => action.action)).toEqual(['pathfinder', 'lookup']);
  });

  it('excludes smart when node category is undefined', () => {
    const actions = getQueryActionsForNodeCategory(allTabsEnabled, undefined);
    expect(actions.map((action) => action.action)).toEqual(['pathfinder', 'lookup']);
  });

  it('returns no actions when only smart is enabled and category is unsupported', () => {
    const actions = getQueryActionsForNodeCategory({}, 'biolink:AnatomicalEntity');
    expect(actions).toEqual([]);
  });
});
