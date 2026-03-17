import { FC } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getNodeById, getResultById, getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { capitalizeAllWords, getDataFromQueryVar } from '@/features/Common/utils/utilities';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { Result, ResultSet } from '@/features/ResultList/types/results';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';

const formatResultLabel = (resultSet: ResultSet | null, result: Result | undefined) => {
  if(!result || !resultSet)
    return undefined;

  const node = getNodeById(resultSet, result.subject);
  if(!node)
    return undefined;

  if(node.types[0] === 'biolink:Gene' || node.types[0] === 'biolink:Protein')
    return node.names[0].toUpperCase();
  else 
    return capitalizeAllWords(result.drug_name);
};

const ResultBreadcrumbLabel: FC = () => {
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);
  const resultSet = useSelector(getResultSetById(queryId));
  const { resultId } = useParams();
  const result = resultId ? getResultById(resultSet, resultId) : undefined;
  const resultLabel = formatResultLabel(resultSet, result);

  if (resultLabel) return <>{resultLabel}</>;
  if (!resultSet) return <SkeletonBar width="100px" height="17px" />;
  return <>Result</>;
};

export default ResultBreadcrumbLabel;
