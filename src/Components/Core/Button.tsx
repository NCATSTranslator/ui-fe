import { FC, MouseEvent, ReactNode } from "react";
import styles from './Button.module.scss';
import { Link } from "react-router-dom";

interface ButtonProps {
  isSecondary?: boolean;
  isTertiary?: boolean;
  handleClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  href?: string;
  link?: boolean;
  iconOnly?: boolean;
  _blank?: boolean;
  type?: "button" | "submit" | "reset";
  smallFont?: boolean;
  children?: ReactNode;
  disabled?: boolean;
  testId?: string;
  className?: string;
  dataTooltipId?: string;
}

const Button: FC<ButtonProps> = ({
  isSecondary = false,
  isTertiary = false,
  handleClick,
  href,
  iconOnly = false,
  _blank = false,
  link = false,
  smallFont = false,
  type = 'button',
  children,
  disabled = false,
  testId,
  className = "",
  dataTooltipId = ""
}) => {
  const buttonStyle = `
    button 
    ${styles.button} 
    ${isTertiary ? styles.tertiary : isSecondary ? styles.secondary : ''}
    ${iconOnly ? styles.iconOnly : ''}
    ${smallFont ? styles.smallFont : ''}
    ${className}
  `.trim();

  const commonProps = {
    className: buttonStyle,
    onClick: handleClick,
    'data-testid': testId,
    'data-tooltip-id': dataTooltipId
  };

  if (href) {
    const linkProps = {
      ...commonProps,
      to: href,
      ..._blank && { target: '_blank', rel: 'noopener noreferrer' }
    };
    return link ? <Link {...linkProps}>{children}</Link> : <a {...linkProps}>{children}</a>;
  }

  return (
    <button
      {...commonProps}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;