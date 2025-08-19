import { useState, useEffect, FC, ReactNode } from "react";
import DefaultIcon from '@/assets/icons/buttons/Checkmark/Checkmark.svg?react';
import styles from './FacetCheckbox.module.scss';

interface FacetCheckboxProps {
  checked?: boolean;
  checkedClassName?: string;
  children?: ReactNode;
  className?: string;
  handleClick: ()=>void;
  icon?: ReactNode;
  labelLeft?: boolean; 
  name?: string;
  title?: string; 
  value?: string | number | undefined;
}

const FacetCheckbox: FC<FacetCheckboxProps> = ({
  checked,
  checkedClassName = "",
  children,
  className = "",
  handleClick,
  icon = false, 
  labelLeft = false,
  name = "",
  title = "",
  value = undefined
  }) => {

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

    <label className={`${styles.facetCheckbox} ${isCheckedClass} ${className}`} title={title} aria-label={title}>
      {
        labelLeft 
        ?
          <>
          <input type="checkbox" defaultChecked={isChecked} name={name} value={value} onChange={handleChange} />
          <span>{children}</span>
          <span className={`${styles.hasIcon} ${styles.box} ${checkedClassName}`}>{icon ? icon : <DefaultIcon/>}</span>
          </>
        :
        <> 
          <span className={`${styles.hasIcon} ${styles.box} ${checkedClassName}`}>{icon ? icon : <DefaultIcon/>}</span>
          <input type="checkbox" defaultChecked={isChecked} name={name} value={value} onChange={handleChange} />
          <span className={styles.children}>{children}</span>
        </>
      }
    </label>

  );
}

export default FacetCheckbox;