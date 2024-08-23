import { FC } from 'react';
import styles from "./TextInput.module.scss";

type TextInputProps = {
  label?: string;
  subtitle?: string;
  value: string;
  placeholder?: string;
  size?: string;
  rows?: number;
  error?: boolean;
  errorText?: string;
  handleChange: (value: string) => void;
  className?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  maxLength?: number;
  handleKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  testId?: string;
  disabled?: boolean;
};

const TextInput: FC<TextInputProps> = ({
  label,
  subtitle,
  value,
  placeholder,
  size = '',
  rows,
  error,
  errorText = "Error Message",
  handleChange,
  className = '',
  iconLeft,
  iconRight,
  maxLength = -1,
  handleKeyDown = () => {},
  testId,
  disabled = false
}) => {
  const hasIconLeftClass = iconLeft ? styles.hasIconLeft : styles.noIconLeft;
  const hasIconRightClass = iconRight ? styles.noIconRight : styles.hasIconRight;

  return (
    <>
      {rows && rows > 1 ? (
        <label className={`text-input ${styles.textInput} ${size} ${hasIconLeftClass} ${hasIconRightClass} ${className}`}> 
          {label && <span className="input-label">{label}</span>}
          {subtitle && <span className="input-subtitle">{subtitle}</span>}
          {iconLeft && <div className={styles.iconContainerLeft}>{iconLeft}</div>}
          {iconRight && <div className={styles.iconContainerRight}>{iconRight}</div>}
          <textarea 
            placeholder={placeholder} 
            rows={rows} 
            onChange={(e) => handleChange(e.target.value)} 
            maxLength={maxLength} 
            value={value}
            onKeyDown={handleKeyDown}
            data-testid={testId}
            disabled={disabled}
          />
          {error && <span className={styles.errorText}>{errorText}</span>}
        </label>
      ) : (
        <label className={`text-input ${styles.textInput} ${size} ${hasIconLeftClass} ${hasIconRightClass} ${className}`}> 
          {label && <span className="input-label">{label}</span>}
          {subtitle && <span className="input-subtitle">{subtitle}</span>}
          {iconLeft && <div className={styles.iconContainerLeft}>{iconLeft}</div>}
          {iconRight && <div className={styles.iconContainerRight}>{iconRight}</div>}
          <input 
            type="text" 
            placeholder={placeholder} 
            onChange={(e) => handleChange(e.target.value)} 
            maxLength={maxLength} 
            value={value}
            onKeyDown={handleKeyDown}
            data-testid={testId}
            disabled={disabled}
          />
          {error && <span className={styles.errorText}>{errorText}</span>}
        </label>
      )}
    </>
  );
}

export default TextInput;
