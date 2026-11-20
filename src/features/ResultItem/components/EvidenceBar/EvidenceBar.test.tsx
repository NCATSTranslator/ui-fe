import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import EvidenceBar from './EvidenceBar';
import { EvidenceCountsContainer } from '@/features/Evidence/types/evidence';
import { EMPTY_EVIDENCE_COUNTS } from '@/features/Evidence/utils/utilities';

const counts = (overrides: Partial<EvidenceCountsContainer> = {}): EvidenceCountsContainer => ({ ...EMPTY_EVIDENCE_COUNTS, ...overrides });

describe('EvidenceBar', () => {
  it('shows the total and a pill per evidence type sized by its count', () => {
    render(<EvidenceBar evidenceCounts={counts({ publicationCount: 30, clinicalTrialCount: 10 })} maxEvidenceTotal={160} />);
    expect(screen.getByText('40')).toHaveTextContent('40 total evidence');
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByLabelText('30 Publications')).toHaveStyle({ flexGrow: '30' });
    expect(screen.getByLabelText('10 Clinical Trials')).toHaveStyle({ flexGrow: '10' });
  });

  it('sizes the bar relative to the largest evidence total in the query', () => {
    render(<EvidenceBar evidenceCounts={counts({ publicationCount: 9 })} maxEvidenceTotal={99} />);
    const track = screen.getByLabelText('9 Publications').parentElement as HTMLElement;
    expect(Number(track.style.getPropertyValue('--bar-scale'))).toBeCloseTo(0.5);
    expect(track.style.getPropertyValue('--segment-count')).toBe('1');
  });

  it('shows a pill\'s count and type only while it is hovered', () => {
    render(<EvidenceBar evidenceCounts={counts({ publicationCount: 30, sourceCount: 2 })} maxEvidenceTotal={32} />);
    expect(screen.queryByText('30 Publications')).not.toBeInTheDocument();

    const pill = screen.getByLabelText('30 Publications');
    fireEvent.mouseEnter(pill);
    expect(screen.getByText('30 Publications')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByLabelText('2 Knowledge Sources'));
    expect(screen.queryByText('30 Publications')).not.toBeInTheDocument();
    expect(screen.getByText('2 Knowledge Sources')).toBeInTheDocument();

    fireEvent.mouseLeave(pill.parentElement as HTMLElement);
    expect(screen.queryByText('2 Knowledge Sources')).not.toBeInTheDocument();
  });

  it('shows only a zero total when there is no evidence', () => {
    render(<EvidenceBar evidenceCounts={null} maxEvidenceTotal={10} />);
    expect(screen.getByText('0')).toHaveTextContent('0 total evidence');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
