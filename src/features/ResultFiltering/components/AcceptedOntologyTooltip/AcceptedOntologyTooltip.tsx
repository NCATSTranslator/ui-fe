import { FC, useId } from "react";
import styles from './AcceptedOntologyTooltip.module.scss';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';

const AcceptedOntologyTooltip: FC = () => {
  const tooltipId = useId();

  return (
    <>
      <InfoIcon data-tooltip-id={tooltipId} className={styles.infoIcon}/>
      <Tooltip id={tooltipId}>
        <span>Relationships marked with Accepted Ontology are based on established taxonomies and classification systems.</span>
      </Tooltip>
    </>
  )
}

export default AcceptedOntologyTooltip;