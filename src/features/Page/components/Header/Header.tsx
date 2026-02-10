import { FC, ReactNode } from 'react';
import styles from './Header.module.scss';
import { Link, useLocation } from 'react-router-dom';
import Logo from '@/assets/images/site-logo.png';

type HeaderProps = {
  children?: ReactNode;
}

const Header: FC<HeaderProps> = ({children}) => {
  const location = useLocation();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to={`/`} className={styles.logo} reloadDocument={location.pathname === "/results" ? false : true}>
          <img src={Logo} alt="Translator Logo" />
        </Link>
      </div>
      <div className={styles.right}>
        <p className={styles.disclaimer} title="This system is for research purposes and is not meant to be used by clinical service providers in the course of treating patients.">This system is for research purposes and is not meant to be used by clinical service providers in the course of treating patients.</p>
      </div>
        {children}
    </header>
  );
}

export default Header;