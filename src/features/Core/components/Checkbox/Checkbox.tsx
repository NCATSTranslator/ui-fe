import { useState, useEffect, FC, ReactNode, useCallback, useMemo } from "react";
import DefaultIcon from '@/assets/icons/buttons/Checkmark/Checkmark.svg?react';
import styles from './Checkbox.module.scss';
import { joinClasses } from "@/features/Common/utils/utilities";
import { uniqueId } from "lodash";
import InputLabel from "../InputLabel/InputLabel";

export interface CheckboxProps {
  checked?: boolean;
  checkedClassName?: string;
  children?: ReactNode;
  className?: string;
  handleClick: () => void;
  icon?: ReactNode;
  label?: string;
  subtitle?: string;
  name?: string;
  title?: string; 
  value?: string | number | undefined;
  disabled?: boolean;
  id?: string;
  'aria-describedby'?: string;
}

const Checkbox: FC<CheckboxProps> = ({
  checked = false,
  checkedClassName = "",
  children,
  className = "",
  handleClick,
  icon,
  label,
  subtitle,
  name = "",
  title = "",
  value,
  disabled = false,
  id,
  'aria-describedby': ariaDescribedby
}) => {

  const [isChecked, setIsChecked] = useState(checked);

  const checkboxClass = joinClasses(
    styles.checkbox,
    isChecked ? styles.checked : styles.unchecked,
    disabled ? styles.disabled : "",
    className
  );

  const boxClass = joinClasses(
    styles.hasIcon,
    styles.box,
    checkedClassName
  );

  const iconToRender = icon || <DefaultIcon />;

  const handleChange = useCallback(() => {
    if (disabled) return;
    
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    handleClick();
  }, [isChecked, handleClick, disabled]);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const checkboxId = useMemo(() => {
    return id || `checkbox-${name || uniqueId()}`;
  }, [id, name]);

  return (
    <label 
      className={checkboxClass} 
      title={title} 
      htmlFor={checkboxId}
      aria-label={title}
    >
      {
        (label || subtitle) && (
          <InputLabel label={label} subtitle={subtitle} />
        )
      }
      <span className={boxClass}>{iconToRender}</span>
      <input 
        type="checkbox" 
        id={checkboxId}
        checked={isChecked}
        name={name} 
        value={value} 
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={ariaDescribedby}
      />
      {
        children && <span className={styles.children}>{children}</span>
      }
    </label>
  );
};

export default Checkbox;