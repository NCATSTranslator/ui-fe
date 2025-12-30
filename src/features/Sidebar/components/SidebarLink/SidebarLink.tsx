import { FC, ReactNode } from "react";
import styles from "./SidebarLink.module.scss";
import Button from "@/features/Core/components/Button/Button";
import Tooltip from "@/features/Common/components/Tooltip/Tooltip";
import { joinClasses } from "@/features/Common/utils/utilities";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";

interface SidebarLinkProps {
  ariaLabel?: string;
  className?: string;
  href?: string;
  hasRedDot?: boolean;
  icon: ReactNode | (() => ReactNode);
  id: string;
  isGrayedOut?: boolean;
  onClick?: () => void;
  to?: string;
  tooltipText: string;
}

const SidebarLink: FC<SidebarLinkProps> = ({
  ariaLabel,
  className = "",
  href,
  hasRedDot = false,
  icon,
  id,
  isGrayedOut = false,
  onClick,
  to,
  tooltipText
}) => {
  const { activePanelId } = useSidebar();
  const tooltipId = `${id}-tooltip`;
  const classNames = joinClasses(
    styles.sidebarLink,
    styles.link,
    isGrayedOut && styles.grayedOut,
    hasRedDot && styles.redDot,
    activePanelId === id && styles.active,
    className
  );
  const isLink = !!to;

  return (
    <>
      <Button
        ariaLabel={ariaLabel || ''}
        link={isLink}
        href={isLink ? to : href}
        handleClick={onClick}
        iconLeft={typeof icon === 'function' ? icon() : icon}
        iconOnly
        dataTooltipId={tooltipId}
        className={classNames}
      >
      </Button>
      {
        tooltipText && (
          <Tooltip id={tooltipId} place="right">
            <span>{tooltipText}</span>
          </Tooltip>
        )
      }
    </>

  );
};

export default SidebarLink;