import React from "react";
import { Link } from 'react-router-dom';
import { currentRoot, currentUser } from "../../Redux/rootSlice";
import { useSelector } from "react-redux";
import {ReactComponent as Logo} from '../../Assets/Images/Logo.svg';
import defaultPfp from '../../Assets/Images/pfp.png';
import styles from './Header.module.scss';

const Header = ({children, handleFeedbackModalOpen}) => {
  
  const root = useSelector(currentRoot);
  const user = useSelector(currentUser);

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.left}>
            <Link to={`/${root}/`} className={styles.logo}><Logo/></Link>
          </div>
          <div className={styles.right}>
            {
              root === 'main' &&
              <Link to={`/${root}/workspace`}>Workspace</Link>
            }
            <Link to={`/${root}/history`}>Search History</Link>
            <button onClick={()=>handleFeedbackModalOpen()}>Send Feedback</button>
            <Link to={`/${root}/help`} className={styles.help} rel="noreferrer" target={'_blank'} >Help</Link>
            {
              root === 'demo'
              ? 
                <Link to={`/login`} className={styles.login} >Log In</Link>
              : 
                <>
                  <Link to={`/main/home`} className={styles.help} >
                    <div className={styles.imageContainer}>
                      {(user?.profile_pic_url)
                        ? <img src={user.profile_pic_url} alt="user profile" className={styles.profilePic}/>
                        : <img src={defaultPfp} alt="user profile" className={styles.profilePic}/>}
                    </div>
                  </Link>
                  <a href={`/main/logout`} className={styles.login} >Log Out</a>
                </>
            }
          </div>
        </div>
      </div>
        {children}
    </header>
  );
}

export default Header;