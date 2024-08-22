import { useEffect, useState, FC, MouseEvent, ReactNode } from "react";
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

const Button: FC<ButtonProps> = ({isSecondary, isTertiary, handleClick = (e) => {}, href, iconOnly, _blank, 
  link = false, smallFont, type = '', children, disabled = false, testId, className, dataTooltipId = ""}) => {

  let buttonStyle = isTertiary ? styles.tertiary : isSecondary ? styles.secondary : '';
  buttonStyle += iconOnly ? ` ${styles.iconOnly}` : '';
  className = !!className ? className : "";

  const [isDisabled, setIsDisabled] = useState(disabled);

  useEffect(() => {
    setIsDisabled(disabled);
  }, [disabled]);

  const onClick = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (handleClick) handleClick(e);
  };

  return (
    <>
      {href ? (
        link ? 
          <Link
          className={`button ${styles.button} ${buttonStyle} ${!!smallFont && styles.smallFont} ${className}`}
          onClick={onClick}
          to={href}
          target={_blank ? '_blank' : undefined}
          rel={_blank ? 'noopener noreferrer' : undefined}
          data-testid={testId}
          data-tooltip-id={dataTooltipId}
        >
          {children}
        </Link>
        :
          <a
            className={`button ${styles.button} ${buttonStyle} ${!!smallFont && styles.smallFont} ${className}`}
            onClick={onClick}
            href={href}
            target={_blank ? '_blank' : undefined}
            rel={_blank ? 'noopener noreferrer' : undefined}
            data-testid={testId}
            data-tooltip-id={dataTooltipId}
          >
            {children}
          </a>
      ) : (
        <button
          className={`button ${styles.button} ${buttonStyle} ${!!smallFont && styles.smallFont} ${className}`}
          type={type as "button" | "submit" | "reset"}
          onClick={onClick}
          disabled={isDisabled}
          data-testid={testId}
          data-tooltip-id={dataTooltipId}
        >
          {children}
        </button>
      )}
    </>
  );
}

export default Button;
