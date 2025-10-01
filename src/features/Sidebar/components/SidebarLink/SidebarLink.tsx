import { FC, ReactNode, useId } from "react";
import styles from "./SidebarLink.module.scss";
import Button from "@/features/Core/components/Button/Button";
import Tooltip from "@/features/Common/components/Tooltip/Tooltip";
import { joinClasses } from "@/features/Common/utils/utilities";

interface SidebarLinkProps {
  ariaLabel?: string;
  className?: string;
  href?: string;
  icon: ReactNode | (() => ReactNode);
  onClick?: () => void;
  tooltipText: string;
}

const SidebarLink: FC<SidebarLinkProps> = ({
  ariaLabel,
  className = "",
  href,
  icon,
  onClick,
  tooltipText
}) => {
  const id = useId();
  const classNames = joinClasses(styles.sidebarLink, styles.link, className);
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
        {
          tooltipText && (
            <Tooltip id={id} place="right">
              <span>{tooltipText}</span>
            </Tooltip>
          )
        }
      </Button>
    </>

  );
};

export default SidebarLink;