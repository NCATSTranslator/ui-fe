import { FC, useId } from "react";
import styles from './Toggle.module.scss';

type ToggleProps = {
  className?: string;
  active?: boolean;
  setActive?: (newActive: boolean) => void;
  labelOne?: string;
  labelTwo?: string;
  ariaLabel?: string;
}

const Toggle: FC<ToggleProps> = ({className = "", active = false, setActive, labelOne, labelTwo, ariaLabel}) => {
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
        aria-label={ariaLabel}
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
