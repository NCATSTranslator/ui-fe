import { FC } from 'react';
import ViewSkeleton from '@/features/Navigation/components/ViewSkeleton/ViewSkeleton';
import { useSelector } from 'react-redux';
import { getQueryStatusById } from '@/features/ResultList/slices/queryStatusSlice';
import { getDataFromQueryVar } from '@/features/Common/utils/utilities';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';

const NodeViewSkeleton: FC = () => {
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);
  const queryStatus = useSelector(getQueryStatusById(queryId));

  const statusMessage = queryStatus && queryStatus.araCount > 0
    ? `Loading results... ${queryStatus.araCount} sources responded`
    : 'Loading results...';

  return <ViewSkeleton statusMessage={statusMessage} />;
};

export default NodeViewSkeleton;
