import styles from './Tab.module.scss';

const Tab = ({heading, onClick, activeTabHeading, tooltipIcon}) => {

  let className = `${styles.tabListItem}`;

  if (activeTabHeading === heading) {
    className += ` ${styles.active}`;
  }

  return (
    <div className={className} onClick={()=>onClick(heading)} >
        <span className={styles.heading}>{heading}</span>
        {
          tooltipIcon && 
          tooltipIcon
        }
        <div className={styles.underline}></div>
    </div>
  );
}


export default Tab;