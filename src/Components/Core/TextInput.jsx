import styles from "./TextInput.module.scss";

const TextInput = (
  {label, subtitle, value, placeholder, size, rows,
    error, errorText, handleChange, className, iconLeft, iconRight,
    maxLength, handleKeyDown, testId, disabled}) => {
  
    size = (size) ? size : '';

  maxLength = (maxLength) ? maxLength : -1;

  handleKeyDown = (handleKeyDown) ? handleKeyDown : ()=>{};
  handleChange = (handleChange) ? handleChange : () => {};
  errorText = (errorText) ? errorText : "Error Message";
  let hasIconLeftClass = (iconLeft) ? styles.hasIconLeft : styles.noIconLeft;
  let hasIconRightClass = (iconRight) ? styles.hasIconRight : styles.noIconRight;

  return (
    <> 
    {
      rows > 1 &&
      <label className={`text-input ${styles.textInput} ${size} ${hasIconLeftClass} ${hasIconRightClass} ${className}`}> 
        {label && <span className="input-label">{label}</span>}
        {subtitle && <span className="input-subtitle">{subtitle}</span>}
        {iconLeft && <div className={styles.iconContainerLeft}>{iconLeft}</div>}
        {iconRight && <div className={styles.iconContainerRight}>{iconRight}</div>}
        <textarea 
          type="text" 
          placeholder={placeholder} 
          rows={rows} 
          onChange={(e) => {handleChange(e.target.value)}} 
          maxLength={maxLength} 
          value={value}
          onKeyDown={handleKeyDown}
          data-testid={testId}
          disabled={disabled}
        />
        {error && <span className={styles.errorText}>{errorText}</span>}
      </label>
    }
    {
      (rows <= 1 || rows === undefined) &&
      <label className={`text-input ${styles.textInput} ${size} ${hasIconLeftClass} ${hasIconRightClass} ${className}`}> 
        {label && <span className="input-label">{label}</span>}
        {subtitle && <span className="input-subtitle">{subtitle}</span>}
        {iconLeft && <div className={styles.iconContainerLeft}>{iconLeft}</div>}
        {iconRight && <div className={styles.iconContainerRight}>{iconRight}</div>}
        <input 
          type="text" 
          placeholder={placeholder} 
          size="1" 
          onChange={(e) => {handleChange(e.target.value)}} 
          maxLength={maxLength} 
          value={value}
          onKeyDown={handleKeyDown}
          data-testid={testId}
          disabled={disabled}
        />
        {error && <span className={styles.errorText}>{errorText}</span>}
      </label>
    }
    </>
  );
}

export default TextInput;