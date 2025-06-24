import { FC, useState, useEffect, useRef, ReactNode, isValidElement, Children } from "react";
import AnimateHeight from "react-animate-height";
import styles from './QuerySelect.module.scss';

interface QuerySelectProps {
  label?: string;
  subtitle?: string;
  value: number | null;
  error?: boolean;
  startExpanded?: boolean;
  stayExpanded?: boolean;
  errorText?: string;
  handleChange?: (val: string) => void;
  handleToggle?: (isOpen: boolean) => void;
  noanimate?: boolean;
  children: ReactNode;
  className?: string;
  iconClass?: string;
}

export const QuerySelect: FC<QuerySelectProps> = ({
  label = "", 
  subtitle = "", 
  value, 
  error = false, 
  startExpanded = false, 
  stayExpanded = false,
  errorText = "Error Message", 
  handleChange = (val: string) => {}, 
  handleToggle = () => {}, 
  noanimate, 
  children, 
  className = "", 
  iconClass = ""
}) => {

  const normalizedValue = (value === null || isNaN(value)) ? 0 : parseInt(value.toString());
  const [selectedItem, setSelectedItem] = useState<number>(normalizedValue);
  const [selectOpen, setSelectOpen] = useState<boolean>(false);
  const [height, setHeight] = useState<number | 'auto'>(0);
  
  const openClass = (selectOpen) ? styles.open : '';
  const animateClass = (noanimate) ? styles.noAnimate : styles.animate;

  const wrapperRef = useRef<HTMLLabelElement>(null);  
  const selectListContainerRef = useRef<HTMLDivElement>(null);  

  const handleSelectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectOpen(prev => {
      handleToggle(!prev);
      return !prev;
    });
  }

  const handleOptionClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    const target = e.target as HTMLSpanElement;
    setSelectedItem(parseInt(target.dataset.value || '0'));
    if (!stayExpanded) {
      setSelectOpen(prev => {
        handleToggle(!prev);
        return !prev;
      });
    }
    handleChange(target.dataset.value || '0');
  }
  
  useEffect(() => {
    if (selectOpen === false) {
      setHeight(0);
    } else {
      setHeight('auto');
    }
  }, [selectOpen])

  useEffect(() => {
    setSelectedItem(parseInt(normalizedValue.toString()));
  }, [normalizedValue])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        handleToggle(false);
        setSelectOpen(false);
        setHeight(0);
      }
    };
    document.addEventListener("click", handleClickOutside);
    // Clean up the event listener on unmount
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleToggle]); 
  
  useEffect(() => {
    if (!startExpanded) {
      return;
    }
      
    // wait 750ms before auto opening the dropdown
    const openSelectTimeout = setTimeout(() => {
      setSelectOpen(true);
      handleToggle(true);
    }, 750);
    return () => {
      clearTimeout(openSelectTimeout);
    };
  }, [startExpanded, handleToggle]);

  const getModifiedName = (children: ReactNode, selectedItem: number): string | undefined => {
    if (Array.isArray(children)) {
      const option = children.find((child) => 
        isValidElement(child) && (child.props as any)?.value === selectedItem
      );
      if (option && isValidElement(option)) {
        // Try to get the data-modified-name from the span inside the option
        const optionChildren = (option.props as any)?.children;
        if (isValidElement(optionChildren) && (optionChildren.props as any)?.['data-modified-name']) {
          return (optionChildren.props as any)['data-modified-name'];
        }
        // Fallback to the regular children content
        return optionChildren?.props?.children || optionChildren;
      }
    }
    return undefined;
  };

  return (
    <>
      <label 
        className={`select ${styles.select} ${animateClass} ${className} ${styles.querySelect}`} 
        ref={wrapperRef}
      > 
        {label && <span className={styles.label}>{label}</span>}
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        <div className={`${styles.selectContainer} ${openClass}`}>
          <div 
            className={styles.selectDisplay} 
            onMouseDown={handleSelectClick} 
          >
            {
              getModifiedName(children, selectedItem)
            }
          </div>
          <div className={styles.iconContainer}>
            <span className={`${styles.icon} ${iconClass}`} onMouseDown={handleSelectClick}></span>
          </div>
          <div className={styles.borderVert}></div>
          {
            noanimate && 
            <div 
              className={`${styles.selectList} ${openClass}`}
              style={
                selectOpen 
                ? {maxHeight: selectListContainerRef.current?.clientHeight}
                : {maxHeight: '0px'}
              }
            >
              <div ref={selectListContainerRef}>
                {
                  Children.map(children, (child, i) => {
                    if (isValidElement(child) && (child.props as any)?.value === selectedItem) {
                      return null;
                    }
                    return (
                      <span 
                        onClick={handleOptionClick} 
                        key={i} 
                        className={styles.option} 
                        data-value={isValidElement(child) ? (child.props as any)?.value : undefined}
                        data-testid={isValidElement(child) ? (child.props as any)?.value : undefined}
                      >
                        {isValidElement(child) ? (child.props as any)?.children : child}
                      </span>
                    );
                  })
                }
              </div>
            </div>
          }
          {
            !noanimate &&
            <AnimateHeight className={`${styles.selectList} ${openClass}`}
              duration={250}
              height={height}
            > 
              {
                Children.map(children, (child, i) => {
                  return (
                    <span 
                      onClick={handleOptionClick} 
                      key={i} 
                      className={styles.option} 
                      data-value={isValidElement(child) ? (child.props as any)?.value : undefined}
                    >
                      {isValidElement(child) ? (child.props as any)?.children : child}
                    </span>
                  );
                })
              }
            </AnimateHeight>
          }
        </div>
        {error && <span className={styles.errorText}>{errorText}</span>}
      </label>
    </>
  );
} 