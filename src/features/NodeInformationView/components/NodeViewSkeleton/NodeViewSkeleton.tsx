import { FC } from 'react';
import ViewSkeleton from '@/features/Navigation/components/ViewSkeleton/ViewSkeleton';
import ResultListTopBar from '@/features/ResultList/components/ResultListTopBar/ResultListTopBar';
import NodeInformationViewStyles from '@/features/NodeInformationView/components/NodeInformationView/NodeInformationView.module.scss';

const NodeViewSkeleton: FC = () => {
  const statusMessage = `Loading node information...`;

  return (
    <div className={NodeInformationViewStyles.nodeInformationView}>
      <ResultListTopBar/>
      <ViewSkeleton statusMessage={statusMessage} />
    </div>
  );
};

export default NodeViewSkeleton;
