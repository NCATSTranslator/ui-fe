import { useState, useEffect, useRef, ReactNode } from "react";
import AnimateHeight from "react-animate-height";
import styles from './Select.module.scss';

// OptionProps for individual <option>
export interface OptionProps<T extends string | number> {
  value: T;
  children: ReactNode;
};

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
  children: React.ReactElement<OptionProps<T>>[];
  testId?: string;
  className?: string;
  iconClass?: string;
};

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
  const [selectedItem, setSelectedItem] = useState<T>(value);
  const [selectOpen, setSelectOpen] = useState(false);
  const [height, setHeight] = useState<0 | 'auto'>(0);
  const openClass = selectOpen ? styles.open : styles.closed;
  const animateClass = noanimate ? styles.noAnimate : styles.animate;

  const wrapperRef = useRef<HTMLLabelElement>(null);

  const handleSelectClick = (e: React.MouseEvent<HTMLSelectElement | HTMLSpanElement>) => {
    e.preventDefault();
    setSelectOpen(!selectOpen);
  };

  const handleOptionClick = (val: T) => {
    setSelectedItem(val);
    setSelectOpen(false);
    handleChange(val);
  };

  useEffect(() => {
    setSelectedItem(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setSelectOpen(false);
        setHeight(0);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    setHeight(selectOpen ? 'auto' : 0);
  }, [selectOpen]);

  return (
    <label className={`select ${styles.select} ${size} ${animateClass} ${className}`} ref={wrapperRef}>
      {
        (label || subtitle) && (
          <span className="input-label-container">
            {label && <span className="input-label">{label}</span>}
            {subtitle && <span className="input-subtitle">{subtitle}</span>}
          </span>
        )
      }
      <div className={`${styles.selectContainer} ${openClass}`}>
        <select
          name={name}
          onMouseDown={handleSelectClick}
          defaultValue={selectedItem}
          key={`${Math.floor(Math.random() * 1000)}-min`}
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
              {children.map((child, i) => (
                <span
                  key={i}
                  onClick={() => handleOptionClick(child.props.value)}
                  className={styles.option}
                  data-value={child.props.value}
                  data-testid={child.props.value}
                >
                  {child.props.children}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <AnimateHeight className={`${styles.selectList} ${openClass}`} duration={250} height={height}>
            {children.map((child, i) => (
              <span
                key={i}
                onClick={() => handleOptionClick(child.props.value)}
                className={styles.option}
                data-value={child.props.value}
              >
                {child.props.children}
              </span>
            ))}
          </AnimateHeight>
        )}
      </div>

      {error && <span className={styles.errorText}>{errorText}</span>}
    </label>
  );
};

export default Select;
