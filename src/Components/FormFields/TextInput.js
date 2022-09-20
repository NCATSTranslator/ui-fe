import React from "react";
import styles from "./TextInput.module.scss";

const TextInput = (
  {label, subtitle, value, placeholder, size, rows,
    error, errorText, handleChange, className, icon, maxLength}) => {
  
  size = (size === undefined) ? 's' : size;

  maxLength = (maxLength) ? maxLength : -1;

  
  // switch (size) {
  //   case 'm':
  //     size = styles.m;
  //     break;
  //   case 'l':
  //     size = styles.l;
  //     break;

  //   default:
  //     size = styles.s;
  //     break;
  // }

  handleChange = (handleChange) ? handleChange : () => {};
  errorText = (errorText) ? errorText : "Error Message";
  let hasIconClass = (icon) ? styles.hasIcon : styles.noIcon;

  return (
    <> 
    {
      rows > 1 &&
      <label className={`text-input ${styles.textInput} ${size} ${hasIconClass} ${className}`}> 
        {label && <span className={styles.label}>{label}</span>}
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {icon && <div className={styles.iconContainer}>{icon}</div>}
        <textarea 
          type="text" 
          placeholder={placeholder} 
          rows={rows} 
          onChange={(e) => {handleChange(e.target.value)}} 
          maxLength={maxLength} 
          value={value}
        />
        {error && <span className={styles.errorText}>{errorText}</span>}
      </label>
    }
    {
      (rows <= 1 || rows === undefined) &&
      <label className={`text-input ${styles.textInput} ${size} ${hasIconClass} ${className}`}> 
        {label && <span className={styles.label}>{label}</span>}
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {icon && <div className={styles.iconContainer}>{icon}</div>}
        <input 
          type="text" 
          placeholder={placeholder} 
          size="1" 
          onChange={(e) => {handleChange(e.target.value)}} 
          maxLength={maxLength} 
          value={value}/>
        {error && <span className={styles.errorText}>{errorText}</span>}
      </label>
    }
    </>
  );
}

export default TextInput;