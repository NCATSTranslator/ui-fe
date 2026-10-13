import { FC } from 'react';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { getQueryTitleFromDecodedParams } from '@/features/Projects/utils/queryTitleUtils';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';

const QueryBreadcrumbLabel: FC = () => {
  const decodedParams = useDecodedParams();
  const queryTitle = getQueryTitleFromDecodedParams(decodedParams);

  if (queryTitle) return <>{queryTitle}</>;
  return <SkeletonBar width="150px" height="17px" />;
};

export default QueryBreadcrumbLabel;
