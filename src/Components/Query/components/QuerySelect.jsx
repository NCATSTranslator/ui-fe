import {useState, useEffect, useRef} from "react";
import AnimateHeight from "react-animate-height";
import styles from './QuerySelect.module.scss';

const QuerySelect = ({label = "", subtitle = "", value, error = false, startExpanded = false, stayExpanded = false,
  errorText = "Error Message", handleChange = (val) => {}, handleToggle = () => {}, noanimate, children, className = "", iconClass = ""}) => {

  value = (value === null || isNaN(value)) ? 0 : parseInt(value);
  const [selectedItem, setSelectedItem] = useState(value);
  const [selectOpen, setSelectOpen] = useState(false);
  const [height, setHeight] = useState(0);
  let openClass = (selectOpen) ? styles.open : '';
  let animateClass = (noanimate) ? styles.noAnimate : styles.animate;

  const wrapperRef = useRef(null);  
  const selectListContainerRef = useRef(null);  

  const handleSelectClick = (e) => {
    e.preventDefault();
    setSelectOpen(prev=>{
      handleToggle(!prev);
      return(!prev);
    });
  }

  const handleOptionClick = (e) => {
    e.preventDefault();
    setSelectedItem(parseInt(e.target.dataset.value));
    if(!stayExpanded) {
      setSelectOpen(prev=>{
        handleToggle(!prev);
        return(!prev);
      });
    }
    handleChange(e.target.dataset.value);
  }
  
  useEffect(() => {
    if(selectOpen === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [selectOpen])

  useEffect(() => {
    setSelectedItem(parseInt(value));
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
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
    if(!startExpanded)
      return;
      
    // wait 750ms before auto opening the dropdown
    let openSelectTimeout = setTimeout(() => {
      setSelectOpen(true);
      handleToggle(true);
    }, 750);
    return () => {
      clearTimeout(openSelectTimeout);
    };
  }, [startExpanded, handleToggle]);

const getModifiedName = (children, selectedItem) => {
  return children.find((option) => option.props.value === selectedItem)?.props?.children?.props['data-modified-name'];
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
                ? {'max-height': selectListContainerRef.current.clientHeight}
                : {'max-height': '0px'}
              }
              >
              <div ref={selectListContainerRef}>
              {
              children.map((child, i) => {
                if(child.props.value === selectedItem)
                  return null;
                return(
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
            > {
              children.map((child, i) => {
                return(
                  <span 
                    onClick={handleOptionClick} 
                    key={i} 
                    className={styles.option} 
                    data-value={child.props.value}
                    >
                    {child.props.children}
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

export default QuerySelect;