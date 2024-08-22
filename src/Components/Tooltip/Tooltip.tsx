import { ReactNode } from 'react';
import styles from './Tooltip.module.scss';
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { PlacesType } from 'react-tooltip';

interface TooltipProps {
  onClose?: () => void;
  children: ReactNode;
  id: string;
  anchorSelect?: string;
  offset?: number;
  delayShow?: number;
  delayHide?: number;
  clickable?: boolean;
  className?: string;
  place?: PlacesType;
}

const Tooltip: React.FC<TooltipProps> = ({
  onClose = () => {},
  children,
  id,
  anchorSelect,
  offset,
  delayShow = 500,
  delayHide = 100,
  clickable = true,
  className = '',
  place = "top"
}) => {
  return (
    <ReactTooltip
      id={id}
      anchorSelect={anchorSelect}
      delayHide={delayHide}
      delayShow={delayShow}
      className={`${styles.tooltip} ${className}`}
      clickable={clickable}
      place={place}
      afterHide={onClose}
      offset={offset}
      positionStrategy={'fixed'}
    >
      {children}
    </ReactTooltip>
  );
};

export default Tooltip;
