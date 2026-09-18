import { FC, useId } from "react";
import styles from './Toggle.module.scss';

type ToggleProps = {
  className?: string;
  active?: boolean;
  setActive?: (newActive: boolean) => void;
  labelOne?: string;
  labelTwo?: string;
  /** Associates the checkbox with visible label text elsewhere in the DOM. */
  ariaLabelledBy?: string;
  /** Associates the checkbox with supplementary description text. */
  ariaDescribedBy?: string;
}

const Toggle: FC<ToggleProps> = ({
  className = "",
  active = false,
  setActive,
  labelOne,
  labelTwo,
  ariaLabelledBy,
  ariaDescribedBy,
}) => {
  const toggleId = useId();

  const handleToggle = () => {
    setActive?.(!active);
  }

  return (
    <div className={`${className} ${styles.toggle}`}>
      <input 
        type="checkbox" 
        id={toggleId} 
        checked={active}
        onChange={handleToggle}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
      />
      {labelOne && <span className={`${styles.label} ${styles.labelOne} ${active ? styles.active : styles.inactive}`}>{labelOne}</span>}
      <label 
        htmlFor={toggleId} 
        className={`${styles.container} ${active ? styles.active : styles.inactive}`}
      >
        <span className={styles.ball}></span>
      </label>
      {labelTwo && <span className={`${styles.label} ${styles.labelTwo} ${active ? styles.active : styles.inactive}`}>{labelTwo}</span>}
    </div>
  );
}

export default Toggle;
