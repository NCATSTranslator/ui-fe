import { FC } from 'react';
import EvidenceIcon from '@/assets/icons/queries/Evidence.svg?react';
import BreadcrumbLabelWithIcon from '@/features/Navigation/components/BreadcrumbLabelWithIcon/BreadcrumbLabelWithIcon';

const CanvasEvidenceBreadcrumbLabel: FC = () => (
  <BreadcrumbLabelWithIcon icon={<EvidenceIcon />}>
    Canvas Evidence
  </BreadcrumbLabelWithIcon>
);

export default CanvasEvidenceBreadcrumbLabel;
