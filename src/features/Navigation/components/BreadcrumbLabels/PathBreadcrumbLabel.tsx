import { FC, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getResultSetById, getResultById } from '@/features/ResultList/slices/resultsSlice';
import { getDataFromQueryVar } from '@/features/Common/utils/utilities';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { derivePathKey } from '@/features/Navigation/utils/navigationUtils';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';

const PathBreadcrumbLabel: FC = () => {
  const { resultId, pathId } = useParams();
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);
  const resultSet = useSelector(getResultSetById(queryId));
  const result = useMemo(() => resultId ? getResultById(resultSet, resultId) : undefined, [resultSet, resultId]);

  const pathKey = useMemo(
    () => getDataFromQueryVar("pkey", decodedParams) ?? derivePathKey(resultSet, result, pathId),
    [decodedParams, resultSet, result, pathId]
  );

  if (pathKey) return <>Path {pathKey}</>;
  if (!resultSet) return <SkeletonBar width="80px" height="17px" />;
  return <>Path</>;
};

export default PathBreadcrumbLabel;
