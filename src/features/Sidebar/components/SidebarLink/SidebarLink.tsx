import { FC, ReactNode, useId } from "react";
import styles from "./SidebarLink.module.scss";
import Button from "@/features/Core/components/Button/Button";
import Tooltip from "@/features/Common/components/Tooltip/Tooltip";
import { joinClasses } from "@/features/Common/utils/utilities";

interface SidebarLinkProps {
  ariaLabel?: string;
  className?: string;
  href?: string;
  hasRedDot?: boolean;
  icon: ReactNode | (() => ReactNode);
  isGrayedOut?: boolean;
  onClick?: () => void;
  tooltipText: string;
}

const SidebarLink: FC<SidebarLinkProps> = ({
  ariaLabel,
  className = "",
  href,
  hasRedDot = false,
  icon,
  isGrayedOut = false,
  onClick,
  tooltipText
}) => {
  const id = useId();
  const classNames = joinClasses(
    styles.sidebarLink,
    styles.link,
    isGrayedOut && styles.grayedOut,
    hasRedDot && styles.redDot,
    className
  );
  const isLink = !!href;

  return (
    <>
      <Button
        ariaLabel={ariaLabel || ''}
        link={isLink}
        href={href}
        handleClick={onClick}
        iconLeft={typeof icon === 'function' ? icon() : icon}
        iconOnly
        dataTooltipId={id}
        className={classNames}
      >
      </Button>
      {
        tooltipText && (
          <Tooltip id={id} place="right">
            <span>{tooltipText}</span>
          </Tooltip>
        )
      }
    </>

  );
};

export default SidebarLink;