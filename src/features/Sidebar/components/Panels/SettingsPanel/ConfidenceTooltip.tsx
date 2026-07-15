import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';

const ConfidenceTooltip = ({iconClassName, linkClassName, dataTooltipId}: {iconClassName?: string, linkClassName?: string, dataTooltipId: string}) => {
  return (
    <>
      <InfoIcon className={iconClassName} />
      <Tooltip id={dataTooltipId}>
        <span>Confidence is a reflection of the level of support that Translator has for each result.</span>
        <br/>
        <span className={linkClassName} onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open('/frequently-asked-questions#confidence', '_blank')}}>Learn more</span>
      </Tooltip>
    </>
  );
};

export default ConfidenceTooltip;