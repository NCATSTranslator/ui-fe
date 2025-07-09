import { FC, useState, useEffect, useCallback, ReactNode, MouseEvent } from 'react';
import AnimateHeight from 'react-animate-height';
import { NavLink } from 'react-router-dom';
import styles from './Accordion.module.scss';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';

export interface AccordionProps {
  title: string;
  titleLink?: string;
  navLink?: boolean;
  extLink?: boolean;
  children: ReactNode;
  expanded?: boolean;
  accordionClass?: string;
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
  panelClass = '',
  icon,
  id,
  onToggle,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [height, setHeight] = useState<number | 'auto'>(expanded ? 'auto' : 0);

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
  }, [isExpanded, disabled, onToggle]);

  useEffect(() => {
    setHeight(isExpanded ? 'auto' : 0);
  }, [isExpanded]);

  useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded]);

  const defaultIcon = <ChevDown />;
  const displayIcon = icon || defaultIcon;
  const expandedClass = isExpanded ? styles.open : styles.closed;

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
            className={styles.accordionButton}
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
            className={styles.accordionButton}
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
            className={styles.accordionButton}
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
      className={styles.accordionButton}
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
      className={`${styles.accordion} accordion ${expandedClass} ${accordionClass}`}
      role="region"
      aria-labelledby={buttonId}
    >
      {titleLink ? (
        <span className={`${styles.accordionButton} ${styles.titleLink}`}>
          {renderTitleWithLink()}
        </span>
      ) : (
        renderSimpleTitle()
      )}
      
      <AnimateHeight
        id={panelId}
        className={`${styles.accordionPanel} ${panelClass} ${expandedClass}`}
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