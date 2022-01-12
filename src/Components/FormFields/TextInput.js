import React from "react";

const TextInput = ({label, subtitle, value, placeholder, size, rows, error, errorText, handleChange}) => {
  
  size = (size === undefined) ? 's' : size;

  handleChange = (handleChange) ? handleChange : () => {};
  errorText = (errorText) ? errorText : "Error Message";

  return (
    <> 
    {
      rows > 1 &&
      <label className={`text-input ${size}`}> 
        {label && <span className="label">{label}</span>}
        {subtitle && <span className="subtitle">{subtitle}</span>}
        <textarea type="text" placeholder={placeholder} rows={rows} onChange={(e) => {handleChange(e.target.value)}} value={value}/>
        {error && <span className="error-text">{errorText}</span>}
      </label>
    }
    {
      (rows <= 1 || rows === undefined) &&
      <label className={`text-input ${size}`}> 
        {label && <span className="label">{label}</span>}
        {subtitle && <span className="subtitle">{subtitle}</span>}
        <input type="text" placeholder={placeholder} size="1" onChange={(e) => {handleChange(e.target.value)}} value={value}/>
        {error && <span className="error-text">{errorText}</span>}
      </label>
    }
    </>
  );
}

export default TextInput;