import { FC, useId } from "react";
import styles from './Toggle.module.scss';

type ToggleProps = {
  className?: string;
  active?: boolean;
  setActive?: (newActive: boolean) => void;
  labelOne?: string;
  labelTwo?: string;
}

const Toggle: FC<ToggleProps> = ({className = "", active = false, setActive, labelOne, labelTwo}) => {
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
