import { FC, useState, useEffect } from "react";
import styles from './Toggle.module.scss';
import { uniqueId } from "lodash";

type ToggleProps = {
  className?: string;
  active?: boolean;
  setActive?: (newActive: boolean) => void;
  labelOne?: string;
  labelTwo?: string;
}

const Toggle: FC<ToggleProps> = ({className = "", active = false, setActive, labelOne, labelTwo}) => {
  const id = uniqueId();
  const [isActive, setIsActive] = useState(active);

  useEffect(() => {
    setIsActive(active);
  }, [active]);

  const handleToggle = () => {
    setIsActive(prev => !prev);
    if (setActive) {
      setActive(!isActive);
    }
  };

  return (
    <div className={`${className} ${styles.toggle}`}>
      <input 
        type="checkbox" 
        id={`checkbox-${id}`} 
        checked={isActive}
        onChange={handleToggle}
      />
      {labelOne && <span className={`${styles.label} ${styles.labelOne} ${isActive ? styles.active : styles.inactive}`}>{labelOne}</span>}
      <label 
        htmlFor={`checkbox-${id}`} 
        className={`${styles.container} ${isActive ? styles.active : styles.inactive}`}
      >
        <span className={styles.ball}></span>
      </label>
      {labelTwo && <span className={`${styles.label} ${styles.labelTwo} ${isActive ? styles.active : styles.inactive}`}>{labelTwo}</span>}
    </div>
  );
}

export default Toggle;
