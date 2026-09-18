import { FC } from 'react';
import ViewSkeleton from '@/features/Navigation/components/ViewSkeleton/ViewSkeleton';
import ViewTopBar from '@/features/Navigation/components/ViewTopBar/ViewTopBar';
import NodeInformationViewStyles from '@/features/NodeInformationView/components/NodeInformationView/NodeInformationView.module.scss';

const NodeViewSkeleton: FC = () => {
  const statusMessage = `Loading node information...`;

  return (
    <div className={NodeInformationViewStyles.nodeInformationView}>
      <ViewTopBar/>
      <ViewSkeleton statusMessage={statusMessage} />
    </div>
  );
};

export default NodeViewSkeleton;
