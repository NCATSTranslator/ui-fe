import React from "react";
import styles from './Footer.module.scss';

const Footer = ({children}) => {

  return (
    <footer className={`${styles.footer} footer`}>
      <div className={`${styles.container} container`}>
        {children}
      </div>
    </footer>
  );
}

export default Footer;