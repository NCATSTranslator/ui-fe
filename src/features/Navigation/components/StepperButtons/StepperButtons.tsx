import { FC, useEffect, useRef } from 'react';
import Button from '@/features/Core/components/Button/Button';
import ArrowUpIcon from '@/assets/icons/directional/Arrows/Arrow Up.svg?react';
import ArrowDownIcon from '@/assets/icons/directional/Arrows/Arrow Down.svg?react';
import type { StepDirection } from '@/features/Analytics/types/analytics.d';
import styles from './StepperButtons.module.scss';

interface StepperButtonsProps {
  /** Names what the arrows step through, e.g. "result" reads as "Previous result". */
  itemLabel: string;
  /** Omitted when there is nothing before the current item, which disables the up arrow. */
  onPrevious?: () => void;
  /** Omitted when there is nothing after the current item, which disables the down arrow. */
  onNext?: () => void;
}

// Stepping can remount the view these buttons sit in (a new result does), which would drop
// keyboard focus. The arrow that was pressed is remembered here so the buttons rendered for
// the item stepped to can take focus back.
let pendingFocus: { itemLabel: string; direction: StepDirection } | null = null;

/**
 * Up and down arrows that step to the item before or after the one being viewed.
 *
 * An arrow with nowhere to go is aria-disabled rather than disabled, so it stays focusable
 * and stepping onto the first or last item does not throw keyboard focus out of the control.
 */
const StepperButtons: FC<StepperButtonsProps> = ({ itemLabel, onPrevious, onNext }) => {
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const previousLabel = `Previous ${itemLabel}`;
  const nextLabel = `Next ${itemLabel}`;

  // Runs after every render so both the remounted and the surviving buttons settle the request.
  useEffect(() => {
    if (pendingFocus?.itemLabel !== itemLabel) return;
    const target = pendingFocus.direction === 'previous' ? previousRef.current : nextRef.current;
    pendingFocus = null;
    target?.focus();
  });

  const step = (direction: StepDirection, handler?: () => void) => {
    if (!handler) return;
    pendingFocus = { itemLabel, direction };
    handler();
  };

  return (
    <div className={styles.stepperButtons} role="group" aria-label={`Step through ${itemLabel}s`}>
      <Button
        ref={previousRef}
        handleClick={() => step('previous', onPrevious)}
        ariaLabel={previousLabel}
        title={previousLabel}
        variant="secondary"
        iconLeft={<ArrowUpIcon />}
        iconOnly
        small
        aria-disabled={!onPrevious}
      />
      <Button
        ref={nextRef}
        handleClick={() => step('next', onNext)}
        ariaLabel={nextLabel}
        title={nextLabel}
        variant="secondary"
        iconLeft={<ArrowDownIcon />}
        iconOnly
        small
        aria-disabled={!onNext}
      />
    </div>
  );
};

export default StepperButtons;
