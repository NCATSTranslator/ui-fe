import styles from './LastViewedTag.module.scss';
import History from '../../Icons/Navigation/History.svg?react';
import { useEffect, useState } from 'react';

const LastViewedTag = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`${styles.lastViewedTag} ${isVisible && styles.visible}`}>
      <History/>
    </div>
  );
}

export default LastViewedTag;