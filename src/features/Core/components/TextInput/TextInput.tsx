import { ChangeEvent, FocusEvent, FC, KeyboardEvent, ReactNode, RefObject, useRef } from 'react';
import styles from "./TextInput.module.scss";
import { joinClasses } from '@/features/Common/utils/utilities';
import InputLabel from '@/features/Core/components/InputLabel/InputLabel';
import Warning from '@/assets/icons/status/Alerts/Warning.svg?react';

interface TextInputProps {
  label?: string;
  subtitle?: string;
  value?: string;
  placeholder?: string;
  rows?: number;
  error?: boolean;
  errorBottom?: boolean;
  errorText?: string;
  handleChange: (value: string) => void;
  handleFocus?: (event: FocusEvent) => void;
  className?: string;
  containerClassName?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  maxLength?: number;
  handleKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  testId?: string;
  disabled?: boolean;
  iconRightClickToReset?: boolean;
  ref?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}

const TextInput: FC<TextInputProps> = ({
  label,
  subtitle,
  value,
  placeholder,
  rows,
  error = false,
  errorBottom = false,
  errorText = "Error Message",
  handleChange,
  handleFocus,
  className = '',
  containerClassName = '',
  iconLeft,
  iconRight,
  maxLength = -1,
  handleKeyDown = () => {},
  testId,
  disabled = false,
  iconRightClickToReset,
  ref
}) => {
  const inputRef = ref as RefObject<HTMLInputElement> || useRef<HTMLInputElement>(null);
  const textareaRef = ref as RefObject<HTMLTextAreaElement> || useRef<HTMLTextAreaElement>(null);

  const containerStyle = joinClasses(
    styles.textInputContainer,
    error && styles.error,
    errorBottom && styles.errorBottom,
    containerClassName
  );

  const inputStyle = joinClasses(
    'text-input',
    styles.textInput,
    iconLeft ? styles.hasIconLeft : styles.noIconLeft,
    iconRight ? styles.hasIconRight : styles.noIconRight,
    disabled && styles.disabled,
    error && styles.error,
    className
  );

  const handleIconRightClick = () => {
    if (iconRightClickToReset && !disabled) {
      // Call the parent's handleChange to update their state
      handleChange('');

      // Also directly reset the input/textarea as a fallback
      // This ensures the input resets even if the parent doesn't update immediately, or isn't controlling the input value directly
      const currentInput = inputRef.current || textareaRef.current;
      if (currentInput) {
        currentInput.value = '';
        // Trigger the change event to ensure React knows the value changed
        currentInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  const commonProps = {
    placeholder: placeholder,
    maxLength: maxLength,
    value: value,
    onKeyDown: handleKeyDown,
    onChange: (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {handleChange(e.target.value)},
    onFocus: handleFocus,
    'data-testid': testId,
    disabled,
  };

  return (
    <div className={containerStyle}>
      {
        (label || subtitle) && (
          <InputLabel
            label={label}
            subtitle={subtitle}
            error={error}
          />
        )
      }
      {error && <span className={styles.errorText}><Warning />{errorText}</span>}
      <label className={inputStyle}>
        {iconLeft && <div className={styles.iconContainerLeft}>{iconLeft}</div>}
        {iconRight && (
          <div
            className={joinClasses(
              styles.iconContainerRight,
              iconRightClickToReset && styles.clickable
            )}
            onClick={handleIconRightClick}
          >
            {iconRight}
          </div>
        )}
        {rows && rows > 1 ? (
          <textarea
            {...commonProps}
            rows={rows}
            ref={textareaRef}
          />
        ) : (
          <input
            {...commonProps}
            type="text"
            ref={inputRef}
          />
        )}
      </label>
    </div>

  );
};

export default TextInput;
