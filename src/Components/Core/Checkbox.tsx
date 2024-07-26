import { useState, useEffect, FC, ReactNode } from "react";
import styles from './Checkbox.module.scss';

interface CheckboxProps {
  name?: string;
  value?: string | number | undefined;
  checked?: boolean;
  children?: ReactNode;
  handleClick: ()=>void;
  className?: string;
  checkedClassName?: string;
  icon: JSX.Element;
}

const Checkbox: FC<CheckboxProps> = ({name = "", value = undefined, checked, children, handleClick, className = "", 
  checkedClassName = "", icon = null}) => {

  const [isChecked, setIsChecked] = useState(checked);

  let isCheckedClass = (isChecked) ? styles.checked : styles.unchecked;

  const handleChange = () => {
    setIsChecked(!isChecked);
    handleClick();
  }
  
  useEffect(() => {
    setIsChecked(checked);
  }, [checked])

  return (

    <label className={`${styles.checkbox} ${isCheckedClass} ${className}`}>
      <input type="checkbox" defaultChecked={isChecked} name={name} value={value} onChange={handleChange} />
      <span>{children}</span>
      <span className={`${icon ? styles.hasIcon : ""} ${styles.circle} ${checkedClassName}`}>{icon && icon}</span>
    </label>

  );
}

export default Checkbox;