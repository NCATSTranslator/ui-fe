import { FC, MouseEvent, ReactNode, RefObject } from "react";
import styles from './Button.module.scss';
import { Link } from "react-router-dom";
import { joinClasses } from "@/features/Common/utils/utilities";

interface ButtonProps {
  ariaLabel?: string;
  variant?: "secondary" | "textOnly";
  inline?: boolean;
  handleClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  href?: string;
  link?: boolean;
  iconOnly?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  _blank?: boolean;
  type?: "button" | "submit" | "reset";
  rel?: string;
  small?: boolean;
  smallFont?: boolean;
  children?: ReactNode;
  disabled?: boolean;
  testId?: string;
  className?: string;
  dataTooltipId?: string;
  title?: string;
  ref?: RefObject<HTMLButtonElement | null>;
}

const Button: FC<ButtonProps> = ({
  title,
  ariaLabel,
  variant,
  inline,
  handleClick,
  href,
  iconOnly = false,
  iconLeft,
  iconRight,
  _blank = false,
  link = false,
  small = false,
  smallFont = false,
  type = 'button',
  rel = '',
  children,
  disabled = false,
  testId,
  className = "",
  dataTooltipId = "",
  ref
}) => {
  const buttonStyle = joinClasses(
    'button',
    styles.button,
    variant === "secondary" && styles.secondary,
    variant === "textOnly" && styles.textOnly,
    iconOnly && styles.iconOnly,
    small && styles.small,
    !!iconLeft && styles.iconLeft,
    !!iconRight && styles.iconRight,
    smallFont && styles.smallFont,
    inline && styles.inline,
    className
  )

  const commonProps = {
    title: title,
    className: buttonStyle,
    onClick: handleClick,
    'data-testid': testId,
    'data-tooltip-id': dataTooltipId
  };

  if (href) {
    const linkProps = {
      ...commonProps,
      rel: rel,
      'aria-label': ariaLabel || '',
      ..._blank && { target: '_blank', rel: 'noopener noreferrer' }
    };
    return link
    ? <Link {...linkProps} to={href}>
        {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
        {iconOnly ? children : <span className={styles.label}>{children}</span>}
        {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
      </Link>
    : <a {...linkProps} href={href}>
        {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
        {iconOnly ? children : <span className={styles.label}>{children}</span>}
        {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
      </a>;
  }

  return (
    <button
      {...commonProps}
      ref={ref}
      type={type}
      disabled={disabled}
    >
      {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
      {iconOnly ? children : <span className={styles.label}>{children}</span>}
      {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
    </button>
  );
}

export default Button;
