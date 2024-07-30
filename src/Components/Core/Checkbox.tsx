import { useState, useEffect, FC, ReactNode } from "react";
import DefaultIcon from '../../Icons/Buttons/Checkmark/Checkmark.svg?react';
import styles from './Checkbox.module.scss';

interface CheckboxProps {
  name?: string;
  value?: string | number | undefined;
  checked?: boolean;
  children?: ReactNode;
  handleClick: ()=>void;
  className?: string;
  checkedClassName?: string;
  icon?: any;
}

const Checkbox: FC<CheckboxProps> = ({name = "", value = undefined, checked, children, handleClick, className = "", 
  checkedClassName = "", icon = false}) => {

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
      <span className={`${styles.hasIcon} ${styles.box} ${checkedClassName}`}>{icon ? icon : <DefaultIcon/>}</span>
      <input type="checkbox" defaultChecked={isChecked} name={name} value={value} onChange={handleChange} />
      <span>{children}</span>
    </label>

  );
}

export default Checkbox;