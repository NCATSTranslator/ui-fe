import { FC } from 'react';
import styles from "./TextInput.module.scss";

type TextInputProps = {
  label?: string;
  subtitle?: string;
  value?: string;
  placeholder?: string;
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
  rows,
  error = false,
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
  const inputStyle = `
    text-input
    ${styles.textInput}
    ${iconLeft ? styles.hasIconLeft : styles.noIconLeft}
    ${iconRight ? styles.hasIconRight : styles.noIconRight}
    ${className}
  `.trim();

  const commonProps = {
    placeholder: placeholder,
    maxLength: maxLength,
    value: value,
    onKeyDown: handleKeyDown,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {handleChange(e.target.value)},
    'data-testid': testId,
    disabled,
  };

  return (
    <label className={inputStyle}>
      <span className="input-label-container">
        {label && <span className="input-label">{label}</span>}
        {subtitle && <span className="input-subtitle">{subtitle}</span>}
      </span>
      {iconLeft && <div className={styles.iconContainerLeft}>{iconLeft}</div>}
      {iconRight && <div className={styles.iconContainerRight}>{iconRight}</div>}
      {rows && rows > 1 ? (
        <textarea
          {...commonProps}
          rows={rows}
        />
      ) : (
        <input
          {...commonProps}
          type="text"
        />
      )}
      {error && <span className={styles.errorText}>{errorText}</span>}
    </label>
  );
};

export default TextInput;