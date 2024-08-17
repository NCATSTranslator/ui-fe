import React, { useState, useEffect, useRef, isValidElement, Children, ReactNode, FC } from "react";
import AnimateHeight from "react-animate-height";
import styles from './Select.module.scss';

type SelectProps = {
  label?: string;
  subtitle?: string;
  value: string | number | null;
  name?: string;
  size?: string;
  error?: boolean;
  errorText?: string;
  handleChange?: (value: string | number) => void;
  noanimate?: boolean;
  children: ReactNode;
  testId?: string;
  className?: string;
  iconClass?: string;
};

const Select: FC<SelectProps> = ({
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
}) => {
  const [selectedItem, setSelectedItem] = useState<string | number | null>(value === null || isNaN(Number(value)) ? "" : value);
  const [selectOpen, setSelectOpen] = useState(false);
  const [height, setHeight] = useState<0 | 'auto'>(0);
  const openClass = selectOpen ? styles.open : styles.closed;
  const animateClass = noanimate ? styles.noAnimate : styles.animate;

  const wrapperRef = useRef<HTMLLabelElement>(null);

  const handleSelectClick = (e: React.MouseEvent<HTMLSelectElement | HTMLSpanElement>) => {
    e.preventDefault();
    setSelectOpen(!selectOpen);
  }

  const handleOptionClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    const value = e.currentTarget.dataset.value || "";
    setSelectedItem(value);
    setSelectOpen(false);
    handleChange(value);
  }

  useEffect(() => {
    if (selectOpen === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [selectOpen]);

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

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <label className={`select ${styles.select} ${size} ${animateClass} ${className}`} ref={wrapperRef}> 
      {label && <span className="input-label">{label}</span>}
      {subtitle && <span className="input-subtitle">{subtitle}</span>}
      <div className={`${styles.selectContainer} ${openClass}`}>
        <select 
          name={name} 
          onMouseDown={handleSelectClick} 
          defaultValue={selectedItem || 0}
          key={`${Math.floor(Math.random() * 1000)}-min`}
          data-testid={testId}
        >
          <option value="" disabled hidden>{name}</option>
          {children}
        </select>
        <span className={`${styles.icon} ${iconClass}`} onMouseDown={handleSelectClick}></span>
        {noanimate ? (
          <div className={`${styles.selectList} ${openClass}`}>
            <div>
              {Children.map(children, (child, i) => {
                if (isValidElement(child)) {
                  return (
                    <span 
                      onClick={handleOptionClick} 
                      key={i} 
                      className={styles.option} 
                      data-value={child.props.value}
                      data-testid={child.props.value}
                    >
                      {child.props.children}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ) : (
          <AnimateHeight className={`${styles.selectList} ${openClass}`}
            duration={250}
            height={height}
          >
            {Children.map(children, (child, i) => {
              if (isValidElement(child)) {
                return (
                  <span 
                    onClick={handleOptionClick} 
                    key={i} 
                    className={styles.option} 
                    data-value={child.props.value}
                  >
                    {child.props.children}
                  </span>
                );
              }
              return null;
            })}
          </AnimateHeight>
        )}
      </div>
      {error && <span className={styles.errorText}>{errorText}</span>}
    </label>
  );
}

export default Select;
