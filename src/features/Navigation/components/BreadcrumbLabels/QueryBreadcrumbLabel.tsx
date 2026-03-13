import { FC } from 'react';
import { getDataFromQueryVar } from '@/features/Common/utils/utilities';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import styles from '@/features/Navigation/components/Breadcrumbs/Breadcrumbs.module.scss';
import { generateQueryTitle } from '@/features/Projects/utils/queryTitleUtils';

const QueryBreadcrumbLabel: FC = () => {
  const decodedParams = useDecodedParams();
  const queryType = getDataFromQueryVar("t", decodedParams);
  const nodeOneLabel = queryType === "pathfinder" ? getDataFromQueryVar("lone", decodedParams) : getDataFromQueryVar("l", decodedParams) || '';
  const nodeTwoLabel = queryType === "pathfinder" ? getDataFromQueryVar("ltwo", decodedParams) : '';
  const constraint = queryType === "pathfinder" ? getDataFromQueryVar("c", decodedParams) : null;

  const queryTitle = generateQueryTitle(queryType, nodeOneLabel || '', nodeTwoLabel || '', constraint);

  if (queryTitle) return <>{queryTitle}</>;
  return <span className={styles.shimmer} />;
};

export default QueryBreadcrumbLabel;
