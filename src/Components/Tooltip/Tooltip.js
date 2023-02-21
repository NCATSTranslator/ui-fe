import styles from './Tooltip.module.scss';
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip as ReactTooltip } from 'react-tooltip'

const Tooltip = ({
  onClose = ()=>{}, 
  children, 
  id, 
  anchorSelect,
  offset, 
  delayShow = 250, 
  delayHide = 100, 
  clickable = true, 
  className,
  place = "top" }) => {

  return(
    <ReactTooltip 
      id={id}
      anchorSelect={anchorSelect}
      delayHide={delayHide}
      delayShow={delayShow}
      className={`${styles.tooltip} ${className}`}
      clickable={clickable}
      place={place}
      afterHide={()=>onClose}
      offset={offset}
      >
      {children}
    </ReactTooltip>
  )
}

export default Tooltip;