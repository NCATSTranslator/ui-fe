import styles from './Tooltip.module.scss';
import { useEffect, useState, useCallback } from 'react';
import { debounce } from 'lodash';



const Tooltip = ({children, active, onClose, heading, text, left, above, hover, delay}) => {

  const [status, setStatus] = useState(active);

  let statusClass = (status) ? styles.open : styles.closed;

  delay = (delay) ? delay : 350;
  onClose = (onClose) ? onClose : ()=>{};

  const handleActivate = useCallback(debounce(() => {
    setStatus(true);
  }, 350), [setStatus])

  const handleDeactivate = useCallback(() => {
    setStatus(false)
    onClose();
    handleActivate.cancel()
  }, [handleActivate])
  
  useEffect(() => {
    if(active)
      handleActivate();
    
    if(!active)
      handleDeactivate();

  }, [active, handleActivate, handleDeactivate]);

  return(
    <div className={`${styles.tooltip} ${statusClass} ${left ? styles.left : ''} ${above ? styles.above : ''}`}>
      <div className={styles.tooltipContainer}>
        {heading && 
          <p className={styles.heading}>{heading}</p>
        }
        {text && 
          <p className={styles.text}>{text}</p>
        }
        {children &&      
          <div className={styles.children}>
            {children}
          </div>
        }
      </div>
    </div>
  )
}

export default Tooltip;