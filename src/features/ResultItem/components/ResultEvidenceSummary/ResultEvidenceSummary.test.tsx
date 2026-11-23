import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultEvidenceSummary from './ResultEvidenceSummary';
import { EvidenceCountsContainer } from '@/features/Evidence/types/evidence';
import { EMPTY_EVIDENCE_COUNTS } from '@/features/Evidence/utils/utilities';

const counts = (overrides: Partial<EvidenceCountsContainer> = {}): EvidenceCountsContainer => ({ ...EMPTY_EVIDENCE_COUNTS, ...overrides });

describe('ResultEvidenceSummary', () => {
  it('shows the evidence bar beside the path count', () => {
    render(<ResultEvidenceSummary evidenceCounts={counts({ publicationCount: 3, sourceCount: 4 })} maxEvidenceTotal={10} pathCount={3} />);
    expect(screen.getByLabelText('3 Publications')).toBeInTheDocument();
    expect(screen.getByLabelText('4 Databases')).toBeInTheDocument();
    expect(screen.getByText('7')).toHaveTextContent('7 total evidence');
    expect(screen.getByText('3 Paths')).toBeInTheDocument();
  });

  it('singularizes a single path', () => {
    render(<ResultEvidenceSummary evidenceCounts={counts({ publicationCount: 2 })} maxEvidenceTotal={2} pathCount={1} />);
    expect(screen.getByText('1 Path')).toBeInTheDocument();
  });

  it('shows a zero total and the path count when there are no evidence counts', () => {
    render(<ResultEvidenceSummary evidenceCounts={null} maxEvidenceTotal={0} pathCount={2} />);
    expect(screen.getByText('0')).toHaveTextContent('0 total evidence');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('2 Paths')).toBeInTheDocument();
  });
});
