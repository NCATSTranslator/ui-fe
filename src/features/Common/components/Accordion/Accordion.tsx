import { FC, useEffect, useCallback, ReactNode, MouseEvent } from 'react';
import AnimateHeight from 'react-animate-height';
import { NavLink } from 'react-router-dom';
import styles from './Accordion.module.scss';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { joinClasses } from '@/features/Common/utils/utilities';
import { useAnimateHeight } from '@/features/Core/hooks/useAnimateHeight';

export interface AccordionProps {
  title: string | ReactNode;
  titleLink?: string;
  navLink?: boolean;
  extLink?: boolean;
  children: ReactNode;
  expanded?: boolean;
  accordionClass?: string;
  buttonClass?: string;
  panelClass?: string;
  icon?: ReactNode;
  id?: string;
  onToggle?: (isExpanded: boolean) => void;
  disabled?: boolean;
}

const Accordion: FC<AccordionProps> = ({
  title,
  titleLink,
  navLink = false,
  extLink = false,
  children,
  expanded = false,
  accordionClass = '',
  buttonClass = '',
  panelClass = '',
  icon,
  id,
  onToggle,
  disabled = false,
}) => {
  const { height, isOpen: isExpanded, setIsOpen: setIsExpanded } = useAnimateHeight({ initialOpen: expanded });

  // Generate unique ID if not provided
  const accordionId = id || `accordion-${Math.random().toString(36).substr(2, 9)}`;
  const panelId = `${accordionId}-panel`;
  const buttonId = `${accordionId}-button`;

  const handleToggle = useCallback((e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (disabled) return;

    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    onToggle?.(newExpandedState);
  }, [isExpanded, disabled, onToggle, setIsExpanded]);

  // Sync with parent's expanded prop
  useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded, setIsExpanded]);

  const defaultIcon = <ChevDown />;
  const displayIcon = icon || defaultIcon;
  const expandedClass = isExpanded ? styles.open : styles.closed;
  const buttonClasses = joinClasses(styles.accordionButton, titleLink && styles.titleLink, buttonClass);
  const accordionClasses = joinClasses(styles.accordion, 'accordion', expandedClass, accordionClass);
  const panelClasses = joinClasses(styles.accordionPanel, panelClass, expandedClass);

  const renderTitleWithLink = () => {
    if (navLink && titleLink) {
      return (
        <NavLink
          to={titleLink}
          className={({ isActive }) =>
            isActive ? `${styles.active} ${styles.navLink}` : styles.navLink
          }
        >
          <span>{title}</span>
          <button
            id={buttonId}
            className={buttonClasses}
            onClick={handleToggle}
            disabled={disabled}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            type="button"
          >
            {displayIcon}
          </button>
        </NavLink>
      );
    }

    if (extLink && titleLink) {
      return (
        <a
          href={titleLink}
          target="_blank"
          rel="noreferrer"
          className={styles.extLink}
        >
          <span>
            {title}
            <ExternalLink className={styles.extLinkIcon} />
          </span>
          <button
            id={buttonId}
            className={buttonClasses}
            onClick={handleToggle}
            disabled={disabled}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            type="button"
          >
            {displayIcon}
          </button>
        </a>
      );
    }

    if (titleLink) {
      return (
        <a href={titleLink}>
          <span>{title}</span>
          <button
            id={buttonId}
            className={buttonClasses}
            onClick={handleToggle}
            disabled={disabled}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            type="button"
          >
            {displayIcon}
          </button>
        </a>
      );
    }

    return null;
  };

  const renderSimpleTitle = () => (
    <button
      id={buttonId}
      className={buttonClasses}
      onClick={handleToggle}
      disabled={disabled}
      aria-expanded={isExpanded}
      aria-controls={panelId}
      type="button"
    >
      {title}
      {displayIcon}
    </button>
  );


  return (
    <div
      id={accordionId}
      className={accordionClasses}
      role="region"
      aria-labelledby={buttonId}
    >
      {titleLink ? (
        <span className={buttonClasses}>
          {renderTitleWithLink()}
        </span>
      ) : (
        renderSimpleTitle()
      )}
      
      <AnimateHeight
        id={panelId}
        className={panelClasses}
        duration={250}
        height={height}
        role="region"
        aria-labelledby={buttonId}
      >
        {children}
      </AnimateHeight>
    </div>
  );
};

export default Accordion; 