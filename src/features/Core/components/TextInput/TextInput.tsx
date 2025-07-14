import { ChangeEvent, FC, KeyboardEvent, ReactNode } from 'react';
import styles from "./TextInput.module.scss";
import { joinClasses } from '@/features/Common/utils/utilities';
import InputLabel from '@/features/Core/components/InputLabel/InputLabel';

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
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  maxLength?: number;
  handleKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
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
  const inputStyle = joinClasses(
    'text-input',
    styles.textInput,
    iconLeft ? styles.hasIconLeft : styles.noIconLeft,
    iconRight ? styles.hasIconRight : styles.noIconRight,
    disabled && styles.disabled,
    error && styles.error,
    className
  );

  const commonProps = {
    placeholder: placeholder,
    maxLength: maxLength,
    value: value,
    onKeyDown: handleKeyDown,
    onChange: (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {handleChange(e.target.value)},
    'data-testid': testId,
    disabled,
  };

  return (
    <div className={styles.textInputContainer}>
      {
        (label || subtitle) && (
          <InputLabel label={label} subtitle={subtitle} />
        )
      }
      {error && <span className={styles.errorText}>{errorText}</span>}
      <label className={inputStyle}>
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
      </label>
    </div>

  );
};

export default TextInput;