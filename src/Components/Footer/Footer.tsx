import { ReactNode, FC } from 'react';
import styles from './Footer.module.scss';

interface FooterProps {
  children: ReactNode;
};

const Footer: FC<FooterProps> = ({ children }) => {
  return (
    <footer className={`${styles.footer} footer`}>
      <div className={`${styles.container} container`}>
        {children}
      </div>
    </footer>
  );
};

export default Footer;
