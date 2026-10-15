import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultEvidenceSummary from './ResultEvidenceSummary';

describe('ResultEvidenceSummary', () => {
  it('shows each evidence type that has a count', () => {
    render(<ResultEvidenceSummary evidenceCounts={{ publicationCount: 3, clinicalTrialCount: 1, miscCount: 2, sourceCount: 4 }} pathCount={3} />);
    expect(screen.getByText('Publications (3)')).toBeInTheDocument();
    expect(screen.getByText('Clinical Trials (1)')).toBeInTheDocument();
    expect(screen.getByText('Misc (2)')).toBeInTheDocument();
    expect(screen.getByText('Sources (4)')).toBeInTheDocument();
    expect(screen.getByText('3 Paths')).toBeInTheDocument();
  });

  it('hides evidence types with a zero count and singularizes a single path', () => {
    render(<ResultEvidenceSummary evidenceCounts={{ publicationCount: 2, clinicalTrialCount: 0, miscCount: 0, sourceCount: 0 }} pathCount={1} />);
    expect(screen.getByText('Publications (2)')).toBeInTheDocument();
    expect(screen.queryByText(/Clinical Trials/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Misc/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sources/)).not.toBeInTheDocument();
    expect(screen.getByText('1 Path')).toBeInTheDocument();
  });

  it('shows only the path count when there are no evidence counts', () => {
    render(<ResultEvidenceSummary evidenceCounts={null} pathCount={2} />);
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
    expect(screen.getByText('2 Paths')).toBeInTheDocument();
  });
});
