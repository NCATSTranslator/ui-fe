import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';

const ConfidenceTooltip = ({iconClassName}: {iconClassName?: string}) => {
  return (
    <>
      <InfoIcon data-tooltip-id="confidence-explanation-tooltip" className={iconClassName} />
      <Tooltip id="confidence-explanation-tooltip">
        <span>Confidence is a reflection of the level of support that Translator has for each result.</span>
      </Tooltip>
    </>
  );
};

export default ConfidenceTooltip;