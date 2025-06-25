import styles from './LastViewedTag.module.scss';
import History from '@/assets/icons/Navigation/Last Viewed Flag Icon.svg?react';
import { useEffect, useState, FC } from 'react';

interface LastViewedTagProps {
  inGroup?: boolean;
  inModal?: boolean;
}
const LastViewedTag: FC<LastViewedTagProps> = ({ inGroup = false, inModal = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`${styles.lastViewedTag} ${inModal && styles.inModal} ${inGroup && styles.inGroup} ${isVisible && styles.visible}`}>
      <History/>
    </div>
  );
}

export default LastViewedTag;