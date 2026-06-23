import { useState, useEffect, ReactNode, ReactElement, MouseEvent } from "react";
import AnimateHeight from "react-animate-height";
import styles from './Select.module.scss';
import InputLabel from "@/features/Core/components/InputLabel/InputLabel";
import OutsideClickHandler from "@/features/Core/components/OutsideClickHandler/OutsideClickHandler";

export interface OptionProps<T extends string | number> {
  value: T;
  children: ReactNode;
}

interface SelectProps<T extends string | number> {
  label?: string;
  subtitle?: string;
  value: T;
  name?: string;
  size?: string;
  error?: boolean;
  errorText?: string;
  handleChange?: (value: T) => void;
  noanimate?: boolean;
  children: ReactElement<OptionProps<T>>[];
  testId?: string;
  className?: string;
  iconClass?: string;
}

const Select = <T extends string | number>({
  label,
  subtitle,
  value,
  name,
  size = '',
  error,
  errorText = "Error Message",
  handleChange = () => {},
  noanimate,
  children,
  testId,
  className = '',
  iconClass
}: SelectProps<T>) => {
  const [selectOpen, setSelectOpen] = useState(false);
  const [height, setHeight] = useState<0 | 'auto'>(0);
  const openClass = selectOpen ? styles.open : styles.closed;
  const animateClass = noanimate ? styles.noAnimate : styles.animate;

  const handleSelectClick = (e: MouseEvent<HTMLSelectElement | HTMLSpanElement>) => {
    e.preventDefault();
    setSelectOpen(!selectOpen);
  };

  const handleOptionClick = (val: T) => {
    setSelectOpen(false);
    handleChange(val);
  };

  useEffect(() => {
    setHeight(selectOpen ? 'auto' : 0);
  }, [selectOpen]);

  const handleOutsideClick = () => {
    setSelectOpen(false);
    setHeight(0);
  };

  const renderOptions = () => children.map((child) => (
    <span
      key={String(child.props.value)}
      onClick={() => handleOptionClick(child.props.value)}
      className={styles.option}
      data-value={child.props.value}
      data-testid={child.props.value}
    >
      {child.props.children}
    </span>
  ));

  return (
    <OutsideClickHandler onOutsideClick={handleOutsideClick}>
      <label className={`select ${styles.select} ${size} ${animateClass} ${className}`}>
        {
          (label || subtitle) && (
            <InputLabel
              label={label}
              subtitle={subtitle}
            />
          )
        }
        <div className={`${styles.selectContainer} ${openClass}`}>
          <select
            name={name}
            onMouseDown={handleSelectClick}
            value={value}
            onChange={() => {}}
            data-testid={testId}
          >
            <option value="" disabled hidden>{name}</option>
            {children.map((child) => (
              <option key={String(child.props.value)} value={child.props.value}>
                {child.props.children}
              </option>
            ))}
          </select>

          <span className={`${styles.icon} ${iconClass}`} onMouseDown={handleSelectClick}></span>

          {noanimate ? (
            <div className={`${styles.selectList} ${openClass}`}>
              <div>
                {renderOptions()}
              </div>
            </div>
          ) : (
            <AnimateHeight className={`${styles.selectList} ${openClass}`} duration={250} height={height}>
              {renderOptions()}
            </AnimateHeight>
          )}
        </div>

        {error && <span className={styles.errorText}>{errorText}</span>}
      </label>
    </OutsideClickHandler>
  );
};

export default Select;
