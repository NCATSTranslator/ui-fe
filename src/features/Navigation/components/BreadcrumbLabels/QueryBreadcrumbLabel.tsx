import { FC } from 'react';
import { getDataFromQueryVar } from '@/features/Common/utils/utilities';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { generateQueryTitle } from '@/features/Projects/utils/queryTitleUtils';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';

const QueryBreadcrumbLabel: FC = () => {
  const decodedParams = useDecodedParams();
  const queryType = getDataFromQueryVar("t", decodedParams);
  const nodeOneLabel = queryType === "p" ? getDataFromQueryVar("lone", decodedParams) : getDataFromQueryVar("l", decodedParams) || '';
  const nodeTwoLabel = queryType === "p" ? getDataFromQueryVar("ltwo", decodedParams) : '';
  const constraint = queryType === "p" ? getDataFromQueryVar("c", decodedParams) : null;

  const queryTitle = generateQueryTitle(queryType, nodeOneLabel || '', nodeTwoLabel || '', constraint);

  if (queryTitle) return <>{queryTitle}</>;
  return <SkeletonBar width="150px" height="17px" />;
};

export default QueryBreadcrumbLabel;
