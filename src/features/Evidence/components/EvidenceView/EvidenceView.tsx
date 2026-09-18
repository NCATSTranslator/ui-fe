import { FC } from 'react';
import { useEvidenceView } from '@/features/Evidence/hooks/useEvidenceView';
import EvidenceViewSkeleton from '@/features/Evidence/components/EvidenceViewSkeleton/EvidenceViewSkeleton';
import ViewNotFound from '@/features/Navigation/components/ViewNotFound/ViewNotFound';
import EvidenceViewContent from '@/features/Evidence/components/EvidenceView/EvidenceViewContent';

const EvidenceView: FC = () => {
  const evidenceViewState = useEvidenceView();

  if (evidenceViewState.status === 'no-query') {
    return <ViewNotFound entity="query" id="missing" />;
  }

  if (evidenceViewState.status === 'loading') {
    return <EvidenceViewSkeleton />;
  }

  if (evidenceViewState.status === 'no-result') {
    return <ViewNotFound entity="result" id={evidenceViewState.resultId || 'unknown'} />;
  }

  if (evidenceViewState.status === 'no-edge') {
    return <ViewNotFound entity="edge" id={evidenceViewState.edgeId || 'unknown'} />;
  }

  return <EvidenceViewContent {...evidenceViewState.content} />;
};

export default EvidenceView;
