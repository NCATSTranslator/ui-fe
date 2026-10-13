import { describe, it, expect } from 'vitest';
import {
  generateQueryTitle,
  generateQueryTitleFromQueryObject,
  getQueryTitleFromDecodedParams,
} from './queryTitleUtils';
import { UserQueryObject } from '@/features/Projects/types/projects.d';

const buildQuery = (
  type: UserQueryObject['data']['query']['type'],
  direction: string | null,
  overrides: Partial<UserQueryObject['data']['query']> = {},
): UserQueryObject => ({
  sid: 1,
  status: 'complete',
  data: {
    aras: [],
    bookmark_ids: [],
    deleted: false,
    note_count: 0,
    qid: 'test-qid',
    query: {
      type,
      direction,
      node_one_label: 'TP53 (Human)',
      ...overrides,
    },
    statistics: { result_count: 0, aux_graph_count: 0 },
    time_created: new Date(),
    time_updated: new Date(),
    time_viewed: null,
    title: null,
  },
});

describe('getQueryTitleFromDecodedParams', () => {
  it('uses query type ID from URL for chemical downregulators', () => {
    expect(getQueryTitleFromDecodedParams('l=TP53 (Human)&i=NCBIGene:7157&t=2'))
      .toBe('TP53 (Human) — Chemical Downregulators');
  });

  it('uses query type ID from URL for chemical upregulators', () => {
    expect(getQueryTitleFromDecodedParams('l=TP53 (Human)&i=NCBIGene:7157&t=1'))
      .toBe('TP53 (Human) — Chemical Upregulators');
  });
});

describe('generateQueryTitle', () => {
  it('distinguishes chemical up vs down by numeric type ID', () => {
    expect(generateQueryTitle('1', 'TP53 (Human)', '', null))
      .toBe('TP53 (Human) — Chemical Upregulators');
    expect(generateQueryTitle('2', 'TP53 (Human)', '', null))
      .toBe('TP53 (Human) — Chemical Downregulators');
  });
});

describe('generateQueryTitleFromQueryObject', () => {
  it('uses direction when resolving chemical query titles', () => {
    expect(generateQueryTitleFromQueryObject(buildQuery('chemical', 'increased')))
      .toBe('TP53 (Human) — Chemical Upregulators');
    expect(generateQueryTitleFromQueryObject(buildQuery('chemical', 'decreased')))
      .toBe('TP53 (Human) — Chemical Downregulators');
  });

  it('uses direction when resolving gene query titles', () => {
    expect(generateQueryTitleFromQueryObject(buildQuery('gene', 'increased')))
      .toBe('TP53 (Human) — Gene Upregulation');
    expect(generateQueryTitleFromQueryObject(buildQuery('gene', 'decreased')))
      .toBe('TP53 (Human) — Gene Downregulation');
  });
});
