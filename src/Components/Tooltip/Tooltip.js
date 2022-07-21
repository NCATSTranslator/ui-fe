import styles from './Tooltip.module.scss';
import { useEffect, useState } from 'react';
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';

const Tooltip = ({children, active, onClose, heading, text}) => {

  const [status, setStatus] = useState(active);

  let statusClass = (status) ? styles.open : styles.closed;

  const handleClose = (e) => {
    e.stopPropagation();
    onClose();
  }
  
  useEffect(() => {
    setStatus(active);
  }, [active]);

  return(
    <div className={`${styles.tooltip} ${statusClass}`}>
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
      <div className={styles.close}><Close onClick={(e)=>handleClose(e)}/></div>
    </div>
  )
}

export default Tooltip;