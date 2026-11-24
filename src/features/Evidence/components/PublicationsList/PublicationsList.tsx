import { Dispatch, FC, SetStateAction, useMemo } from 'react';
import { useSelector } from 'react-redux';
import LoadingBar from '@/features/Core/components/LoadingBar/LoadingBar';
import { PublicationObject } from '@/features/Evidence/types/evidence';
import { ResultEdge } from '@/features/ResultList/types/results';
import { getNodeById, getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { usePubmedDataFetch } from '@/features/Evidence/hooks/evidenceHooks';
import PublicationCard, { EdgeNodeNames } from '@/features/Evidence/components/PublicationsList/PublicationCard';
import cardStyles from '@/features/Evidence/components/EvidenceSection/evidenceCards.module.scss';

interface PublicationsListProps {
  pk: string;
  /** Already in display order (see sortPublications). */
  publications: PublicationObject[];
  selectedEdge: ResultEdge | null;
  setPublications: Dispatch<SetStateAction<PublicationObject[]>>;
  /** Owned by the evidence view, which also needs the loading flag for the download button. */
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

/**
 * The publications supporting the selected relationship, in the order given. Titles, journals,
 * years, and snippets are filled in from PubMed after mounting.
 */
const PublicationsList: FC<PublicationsListProps> = ({
  pk,
  publications,
  selectedEdge,
  setPublications,
  isLoading,
  setIsLoading,
}) => {
  const resultSet = useSelector(getResultSetById(pk));
  usePubmedDataFetch({
    publications,
    selectedEdgeId: selectedEdge?.id || null,
    setPublications,
    setIsLoading,
  });

  // Looked up once for the whole list rather than by every card
  const nodeNames = useMemo((): EdgeNodeNames | null => {
    if (!resultSet) return null;
    return {
      subject: getNodeById(resultSet, selectedEdge?.subject)?.names[0] || '',
      object: getNodeById(resultSet, selectedEdge?.object)?.names[0] || '',
    };
  }, [resultSet, selectedEdge]);

  if (isLoading)
    return <LoadingBar useIcon reducedPadding loadingText="Retrieving Evidence" />;

  return (
    <ul className={cardStyles.list}>
      {publications.map((pub) => (
        <PublicationCard
          key={pub.id ?? pub.url}
          pub={pub}
          selectedEdge={selectedEdge}
          nodeNames={nodeNames}
        />
      ))}
    </ul>
  );
};

export default PublicationsList;
