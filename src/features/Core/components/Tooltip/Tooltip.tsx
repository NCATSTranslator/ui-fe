import { ReactNode, FC } from 'react';
import { PlacesType, PositionStrategy, Tooltip as ReactTooltip } from 'react-tooltip';
import { joinClasses } from '@/features/Common/utils/utilities';
import styles from './Tooltip.module.scss';
import 'react-tooltip/dist/react-tooltip.css';

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
  className,
  clickable = true,
  delayHide = 100,
  delayShow = 500,
  id,
  isOpen,
  offset,
  onClose,
  place = 'top',
  positionStrategy = 'fixed',
}) => {
  return (
    <ReactTooltip
      id={id}
      anchorSelect={anchorSelect}
      className={joinClasses(styles.tooltip, className)}
      clickable={clickable}
      delayHide={delayHide}
      delayShow={delayShow}
      isOpen={isOpen}
      offset={offset}
      place={place}
      positionStrategy={positionStrategy}
      afterHide={onClose}
    >
      {children}
    </ReactTooltip>
  );
};

export default Tooltip;
