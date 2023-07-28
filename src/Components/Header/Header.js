import React from "react";
import { Link } from 'react-router-dom';
import { currentRoot } from "../../Redux/rootSlice";
import { useSelector } from "react-redux";
import {ReactComponent as Logo} from '../../Assets/Images/Logo.svg';
import styles from './Header.module.scss';

const Header = ({children, handleFeedbackModalOpen}) => {
  
  const pathRoot = useSelector(currentRoot);

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.left}>
            <Link to={`/${pathRoot}/`} className={styles.logo}><Logo/></Link>
          </div>
          <div className={styles.right}>
            <Link to={`/${pathRoot}/history`}>Search History</Link>
            <button onClick={()=>handleFeedbackModalOpen()}>Send Feedback</button>
            <Link to={`/${pathRoot}/help`} className={styles.help} rel="noreferrer" target={'_blank'} >Help</Link>
          </div>
        </div>
      </div>
        {children}
    </header>
  );
}

export default Header;