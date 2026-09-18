import { describe, it, expect, beforeEach } from 'vitest';
import type { MouseEvent } from 'react';
import { getEvidenceLinkTrackingProps } from './linkTracking';

const auxClick = (button: number) => ({ button }) as MouseEvent<HTMLAnchorElement>;

describe('getEvidenceLinkTrackingProps', () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it('tracks a primary click', () => {
    getEvidenceLinkTrackingProps('publication', 'https://pubmed.ncbi.nlm.nih.gov/1/').onClick();
    expect(window.dataLayer).toEqual([
      { event: 'evidence_link_clicked', link_type: 'publication', link_domain: 'pubmed.ncbi.nlm.nih.gov' },
    ]);
  });

  it('tracks a middle-click, which opens the link without firing click', () => {
    getEvidenceLinkTrackingProps('source', 'https://example.org').onAuxClick(auxClick(1));
    expect(window.dataLayer).toHaveLength(1);
  });

  it('ignores a right-click, which opens a menu rather than the link', () => {
    getEvidenceLinkTrackingProps('source', 'https://example.org').onAuxClick(auxClick(2));
    expect(window.dataLayer).toEqual([]);
  });
});
