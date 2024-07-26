import { useEffect, useState, FC, MouseEvent, ReactNode } from "react";
import styles from './Button.module.scss';
import { Link } from "react-router-dom";

interface ButtonProps {
  isSecondary?: boolean;
  handleClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  href?: string;
  link?: boolean;
  iconOnly?: boolean;
  _blank?: boolean;
  type?: "button" | "submit" | "reset";
  size?: 's' | 'm' | 'l';
  children?: ReactNode;
  disabled?: boolean;
  testId?: string;
  className?: string;
}

const Button: FC<ButtonProps> = ({isSecondary, handleClick = (e) => {}, href, iconOnly, _blank, link = false, size = "", type = '', children,
  disabled = false, testId, className}) => {

  let buttonStyle = isSecondary ? styles.secondary : styles.primary;
  buttonStyle += iconOnly ? ` ${styles.iconOnly}` : '';

  const [clicked, setClicked] = useState(false);
  const [isDisabled, setIsDisabled] = useState(disabled);

  useEffect(() => {
    setIsDisabled(disabled);
  }, [disabled]);

  const onClick = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    setClicked(true);
    if (handleClick) handleClick(e);
  };

  return (
    <>
      {href ? (
        link ? 
          <Link
          className={`button ${styles.button} ${buttonStyle} ${clicked ? styles.clicked : ''} ${className}`}
          onClick={onClick}
          to={href}
          target={_blank ? '_blank' : undefined}
          rel={_blank ? 'noopener noreferrer' : undefined}
          data-testid={testId}
        >
          {children}
        </Link>
        :
          <a
            className={`button ${styles.button} ${buttonStyle} ${clicked ? styles.clicked : ''} ${className}`}
            onClick={onClick}
            href={href}
            target={_blank ? '_blank' : undefined}
            rel={_blank ? 'noopener noreferrer' : undefined}
            data-testid={testId}
          >
            {children}
          </a>
      ) : (
        <button
          className={`button ${styles.button} ${buttonStyle} ${clicked ? styles.clicked : ''} ${className}`}
          type={type as "button" | "submit" | "reset"}
          onClick={onClick}
          disabled={isDisabled}
          data-testid={testId}
        >
          {children}
        </button>
      )}
    </>
  );
}

export default Button;
