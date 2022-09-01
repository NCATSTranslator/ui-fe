import styles from './Tooltip.module.scss';
import { useEffect, useState } from 'react';
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';
import { debounce } from 'lodash';

const Tooltip = ({children, active, onClose, heading, text, left, above, hover, delay}) => {

  const [status, setStatus] = useState(active);

  let statusClass = (status) ? styles.open : styles.closed;

  delay = (delay) ? delay : 350;

  const handleClose = (e) => {
    e.stopPropagation();
    onClose();
  }

  const handleActivate = debounce((type) => {
    setStatus(true);
  }, 350)

  const handleDeactivate = (type) => {
    setStatus(false)
    handleActivate.cancel()
  }
  
  useEffect(() => {
    if(active)
      handleActivate();
    
    if(!active)
      handleDeactivate();

  }, [active]);

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
        {/* <div className={styles.close}><Close onClick={(e)=>handleClose(e)}/></div> */}
      </div>
    </div>
  )
}

export default Tooltip;