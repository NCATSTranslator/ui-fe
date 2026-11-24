import { FC, ReactNode, useId } from 'react';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';

interface InfoTooltipProps {
  /** The tooltip's content. */
  children: ReactNode;
  iconClassName?: string;
}

/**
 * An info icon that shows a tooltip on hover. The tooltip itself renders in a portal, so this is
 * safe to place inside headings and other elements that only allow inline content.
 */
const InfoTooltip: FC<InfoTooltipProps> = ({ children, iconClassName }) => {
  const tooltipId = useId();

  return (
    <>
      <InfoIcon className={iconClassName} data-tooltip-id={tooltipId} />
      <Tooltip id={tooltipId}>{children}</Tooltip>
    </>
  );
};

export default InfoTooltip;
