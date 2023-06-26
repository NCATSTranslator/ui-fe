import styles from './Tab.module.scss';

const Tab = ({heading, onClick, activeTabHeading}) => {

  let className = `${styles.tabListItem}`;

  if (activeTabHeading === heading) {
    className += ` ${styles.active}`;
  }

  return (
    <div className={className}>
        <span className={styles.heading} onClick={onClick} data-heading={heading}>{heading}</span>
        <div className={styles.underline}></div>
    </div>
  );
}


export default Tab;