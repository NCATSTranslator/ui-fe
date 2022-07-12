import React from "react";
import styles from "./TextInput.module.scss";

const TextInput = ({label, subtitle, value, placeholder, size, rows, error, errorText, handleChange, className, icon}) => {
  
  size = (size === undefined) ? 's' : size;

  handleChange = (handleChange) ? handleChange : () => {};
  errorText = (errorText) ? errorText : "Error Message";

  return (
    <> 
    {
      rows > 1 &&
      <label className={`${styles.textInput} ${size} ${className}`}> 
        {label && <span className={styles.label}>{label}</span>}
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {icon && <div className={styles.iconContainer}>{icon}</div>}
        <textarea type="text" placeholder={placeholder} rows={rows} onChange={(e) => {handleChange(e.target.value)}} value={value}/>
        {error && <span className={styles.errorText}>{errorText}</span>}
      </label>
    }
    {
      (rows <= 1 || rows === undefined) &&
      <label className={`${styles.textInput} ${size}`}> 
        {label && <span className={styles.label}>{label}</span>}
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {icon && <div className={styles.iconContainer}>{icon}</div>}
        <input type="text" placeholder={placeholder} size="1" onChange={(e) => {handleChange(e.target.value)}} value={value}/>
        {error && <span className={styles.errorText}>{errorText}</span>}
      </label>
    }
    </>
  );
}

export default TextInput;