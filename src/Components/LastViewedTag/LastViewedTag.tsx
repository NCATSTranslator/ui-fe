import styles from './LastViewedTag.module.scss';

const LastViewedTag = () => {

  return (
    <div className={styles.lastViewedTag}><span className={styles.text}>Last Viewed</span></div>
  );
}

export default LastViewedTag;