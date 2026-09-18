import { ChangeEvent, FocusEvent, FC, KeyboardEvent, ReactNode, RefObject, useRef } from 'react';
import styles from "./TextInput.module.scss";
import { joinClasses } from '@/features/Core/utils/classHelpers';
import InputLabel from '@/features/Core/components/InputLabel/InputLabel';
import Warning from '@/assets/icons/status/Alerts/Warning.svg?react';

const handleIconRightReset = (
  iconRightClickToReset: boolean | undefined,
  disabled: boolean,
  inputRef: RefObject<HTMLInputElement | null>,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  handleChange: (value: string) => void
) => {
  if (!iconRightClickToReset || disabled) return;
  handleChange('');
  const currentInput = inputRef.current || textareaRef.current;
  if (currentInput) {
    currentInput.value = '';
    currentInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
};

const getContainerClasses = (error: boolean, errorBottom: boolean, containerClassName: string): string =>
  joinClasses(
    styles.textInputContainer,
    error && styles.error,
    errorBottom && styles.errorBottom,
    containerClassName
  );

const getInputClasses = (
  iconLeft: ReactNode, iconRight: ReactNode, disabled: boolean, error: boolean, className: string
): string =>
  joinClasses(
    'text-input',
    styles.textInput,
    iconLeft ? styles.hasIconLeft : styles.noIconLeft,
    iconRight ? styles.hasIconRight : styles.noIconRight,
    disabled && styles.disabled,
    error && styles.error,
    className
  );

const TextInputHeader: FC<{
  label?: string;
  subtitle?: string;
  error: boolean;
  errorText: string;
}> = ({ label, subtitle, error, errorText }) => (
  <>
    {(label || subtitle) && <InputLabel label={label} subtitle={subtitle} error={error} />}
    {error && <span className={styles.errorText}><Warning />{errorText}</span>}
  </>
);

interface TextInputCommonProps {
  placeholder?: string;
  maxLength?: number;
  value?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onChange: (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  'data-testid'?: string;
  disabled: boolean;
}

const TextInputField: FC<{
  iconLeft?: ReactNode;
  iconLeftClassName: string;
  iconRight?: ReactNode;
  iconRightClickToReset?: boolean;
  onIconRightClick: () => void;
  rows?: number;
  commonProps: TextInputCommonProps;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
}> = ({ iconLeft, iconLeftClassName, iconRight, iconRightClickToReset, onIconRightClick, rows, commonProps, textareaRef, inputRef }) => (
  <>
    {iconLeft && <div className={`${styles.iconContainerLeft} ${iconLeftClassName}`}>{iconLeft}</div>}
    {iconRight && (
      <div
        className={joinClasses(styles.iconContainerRight, iconRightClickToReset && styles.clickable)}
        onClick={onIconRightClick}
      >
        {iconRight}
      </div>
    )}
    {rows && rows > 1 ? (
      <textarea {...commonProps} rows={rows} ref={textareaRef} />
    ) : (
      <input {...commonProps} type="text" ref={inputRef} />
    )}
  </>
);

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
  iconLeftClassName?: string;
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
  iconLeftClassName = '',
  iconRight,
  maxLength = -1,
  handleKeyDown = () => {},
  testId,
  disabled = false,
  iconRightClickToReset,
  ref
}) => {
  const initInputRef = useRef<HTMLInputElement>(null);
  const initTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = ref as RefObject<HTMLInputElement> || initInputRef;
  const textareaRef = ref as RefObject<HTMLTextAreaElement> || initTextareaRef;

  const containerStyle = getContainerClasses(error, errorBottom, containerClassName);
  const inputStyle = getInputClasses(iconLeft, iconRight, disabled, error, className);

  const handleIconRightClick = () => {
    handleIconRightReset(iconRightClickToReset, disabled, inputRef, textareaRef, handleChange);
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
      <TextInputHeader label={label} subtitle={subtitle} error={error} errorText={errorText} />
      <label className={inputStyle}>
        <TextInputField
          iconLeft={iconLeft}
          iconLeftClassName={iconLeftClassName}
          iconRight={iconRight}
          iconRightClickToReset={iconRightClickToReset}
          onIconRightClick={handleIconRightClick}
          rows={rows}
          commonProps={commonProps}
          textareaRef={textareaRef}
          inputRef={inputRef}
        />
      </label>
    </div>
  );
};

export default TextInput;
