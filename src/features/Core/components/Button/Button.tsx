import {
  ButtonHTMLAttributes,
  CSSProperties,
  FC,
  MouseEvent,
  ReactNode,
  RefObject,
} from "react";
import styles from './Button.module.scss';
import { Link } from "react-router-dom";
import { joinClasses } from "@/features/Core/utils/classHelpers";

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'className' | 'disabled' | 'style' | 'title' | 'type' | 'onClick'
>;

interface ButtonProps extends NativeButtonProps {
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
  style?: CSSProperties;
}

const getButtonClasses = (props: Pick<
  ButtonProps,
  'variant' | 'inline' | 'iconOnly' | 'small' | 'iconLeft' | 'iconRight' | 'smallFont' | 'className'
>): string =>
  joinClasses(
    'button',
    styles.button,
    props.variant === "secondary" && styles.secondary,
    props.variant === "textOnly" && styles.textOnly,
    props.iconOnly && styles.iconOnly,
    props.small && styles.small,
    !!props.iconLeft && styles.iconLeft,
    !!props.iconRight && styles.iconRight,
    props.smallFont && styles.smallFont,
    props.inline && styles.inline,
    props.className
  );

const ButtonContent: FC<Pick<ButtonProps, 'iconOnly' | 'iconLeft' | 'iconRight' | 'children'>> = ({
  iconOnly, iconLeft, iconRight, children
}) => (
  <>
    {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
    {iconOnly ? children : <span className={styles.label}>{children}</span>}
    {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
  </>
);

const resolveAriaLabel = (ariaLabel?: string, ariaLabelAttr?: unknown) => {
  if (ariaLabel) return ariaLabel;
  if (typeof ariaLabelAttr === 'string') return ariaLabelAttr;
  return undefined;
};

interface LinkedButtonProps {
  href: string;
  link: boolean;
  blank: boolean;
  rel: string;
  commonProps: Record<string, unknown>;
  content: ReactNode;
}

const LinkedButton: FC<LinkedButtonProps> = ({ href, link, blank, rel, commonProps, content }) => {
  const linkProps = blank
    ? { ...commonProps, target: '_blank', rel: 'noopener noreferrer' }
    : { ...commonProps, rel };
  if (link) return <Link {...linkProps} to={href}>{content}</Link>;
  return <a {...linkProps} href={href}>{content}</a>;
};

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
  ref,
  style,
  ...rest
}) => {
  const buttonStyle = getButtonClasses({ variant, inline, iconOnly, small, iconLeft, iconRight, smallFont, className });
  const content = <ButtonContent iconOnly={iconOnly} iconLeft={iconLeft} iconRight={iconRight}>{children}</ButtonContent>;
  const {
    'aria-label': ariaLabelAttr,
    ...domProps
  } = rest;
  const commonProps = {
    title: title,
    className: buttonStyle,
    onClick: handleClick,
    'data-testid': testId,
    'data-tooltip-id': dataTooltipId,
    style: style,
    'aria-label': resolveAriaLabel(ariaLabel, ariaLabelAttr),
  };

  if (href) {
    return (
      <LinkedButton
        href={href}
        link={link}
        blank={_blank}
        rel={rel}
        commonProps={commonProps}
        content={content}
      />
    );
  }

  return (
    <button
      {...domProps}
      {...commonProps}
      ref={ref}
      type={type}
      disabled={disabled}
    >
      {content}
    </button>
  );
}

export default Button;
