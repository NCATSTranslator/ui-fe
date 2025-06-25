import { ReactNode, FC} from 'react';
import styles from './Tooltip.module.scss';
import 'react-tooltip/dist/react-tooltip.css';
import {PlacesType, PositionStrategy, Tooltip as ReactTooltip } from 'react-tooltip';

interface TooltipProps {
  anchorSelect?: string;
  children: ReactNode;
  className?: string;
  clickable?: boolean;
  delayHide?: number;
  delayShow?: number;
  id: string;
  isOpen?: boolean;
  offset?: number;
  onClose?: () => void;
  place?: PlacesType;
  positionStrategy?: PositionStrategy;
}

const Tooltip: FC<TooltipProps> = ({
  anchorSelect,
  children,
  className = '',
  clickable = true,
  delayHide = 100,
  delayShow = 500,
  id,
  isOpen,
  offset,
  onClose = () => {},
  place = "top",
  positionStrategy = "fixed"
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
      positionStrategy={positionStrategy}
      {... isOpen !== undefined && {isOpen:isOpen}}
    >
      {children}
    </ReactTooltip>
  );
};

export default Tooltip;
