import { FC, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getResultSetById, getResultById } from '@/features/ResultList/slices/resultsSlice';
import { getDataFromQueryVar } from '@/features/Common/utils/utilities';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { derivePathKey } from '@/features/Navigation/utils/navigationUtils';
import styles from '@/features/Navigation/components/Breadcrumbs/Breadcrumbs.module.scss';

const PathBreadcrumbLabel: FC = () => {
  const { resultId, pathId } = useParams();
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);
  const resultSet = useSelector(getResultSetById(queryId));
  const result = useMemo(() => resultId ? getResultById(resultSet, resultId) : undefined, [resultSet, resultId]);

  const pathKey = useMemo(() => derivePathKey(resultSet, result, pathId), [resultSet, result, pathId]);

  if (pathKey) return <>Path {pathKey}</>;
  if (!resultSet) return <span className={styles.shimmer} />;
  return <>Path</>;
};

export default PathBreadcrumbLabel;
