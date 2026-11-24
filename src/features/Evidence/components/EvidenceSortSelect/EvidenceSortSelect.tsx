import { KeyboardEvent } from 'react';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import useDropdownMenuA11y from '@/features/Core/hooks/useDropdownMenuA11y';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { getEvidenceSortLabel } from '@/features/Evidence/utils/evidenceSortOptions';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import styles from './EvidenceSortSelect.module.scss';

interface EvidenceSortSelectProps<T extends string> {
  /** What is being sorted, for assistive technology, e.g. "publications". */
  label: string;
  /** The sort orders to offer, in display order. */
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** Shows the current order but does not let it be changed, e.g. while the list is loading. */
  disabled?: boolean;
}

/** A compact "Sort by" menu for the heading row of an evidence section. */
const EvidenceSortSelect = <T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: EvidenceSortSelectProps<T>) => {
  const { open, close, toggle, triggerRef, menuRef, triggerA11yProps, menuA11yProps } = useDropdownMenuA11y();
  const isOpen = open && !disabled;

  // Escape closes the menu only, not the modal the evidence view may be shown in
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && isOpen) event.stopPropagation();
  };

  const handleSelect = (option: T) => {
    close();
    // The chosen item is about to unmount, which would otherwise drop focus to the page
    triggerRef.current?.focus();
    if (option !== value) onChange(option);
  };

  return (
    <OutsideClickHandler className={styles.wrapper} onOutsideClick={close} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className={joinClasses(styles.trigger, isOpen && styles.open)}
        {...triggerA11yProps}
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuA11yProps.id : undefined}
        aria-label={`Sort ${label} by ${getEvidenceSortLabel(value)}`}
        disabled={disabled}
        onClick={toggle}
      >
        Sort by {getEvidenceSortLabel(value)}
        <ChevDown className={styles.chevron} aria-hidden="true" />
      </button>
      {isOpen && (
        <div ref={menuRef} className={styles.menu} {...menuA11yProps} aria-label={`Sort ${label} by`}>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={option === value}
              className={joinClasses(styles.option, option === value && styles.selected)}
              onClick={() => handleSelect(option)}
            >
              {getEvidenceSortLabel(option)}
            </button>
          ))}
        </div>
      )}
    </OutsideClickHandler>
  );
};

export default EvidenceSortSelect;
