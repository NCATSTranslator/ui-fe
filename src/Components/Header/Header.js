import React from "react";
import { Link, useNavigate } from 'react-router-dom';
import { currentConfig, currentRoot, currentUser } from "../../Redux/rootSlice";
import { useSelector } from "react-redux";
import {ReactComponent as Logo} from '../../Assets/Images/Logo.svg';
import {ReactComponent as History} from '../../Icons/Navigation/History.svg';
import {ReactComponent as Feedback} from '../../Icons/Navigation/Feedback.svg';
import {ReactComponent as Workspace} from '../../Icons/Navigation/Workspace.svg';
import {ReactComponent as Question} from '../../Icons/Navigation/Question.svg';
import defaultPfp from '../../Assets/Images/pfp.png';
import styles from './Header.module.scss';
import { handleLogout } from "../../Utilities/userApi";

const Header = ({children, handleFeedbackModalOpen}) => {
  
  const root = useSelector(currentRoot);
  const user = useSelector(currentUser);
  const config = useSelector(currentConfig);

  const handleLogoutClick = () => {
    handleLogout(config?.social_providers?.una?.client_id);
  } 

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
              <Link to={`/${root}/workspace`} className={styles.workspaceLink}><Workspace/><span>Workspace</span></Link>
            }
            <Link to={`/${root}/history`}><History/><span>Search History</span></Link>
            <button onClick={()=>handleFeedbackModalOpen()}><Feedback/><span>Send Feedback</span></button>
            <Link to={`/${root}/help`} className={styles.helpLink} rel="noreferrer" target={'_blank'} ><Question/><span>Help</span></Link>
            {
              root === 'demo'
              ? 
                <Link to={`/login`} className={styles.login} >Log In</Link>
              : 
                <>
                  <Link to={`/main/home`} >
                    <div className={styles.imageContainer}>
                      {(user?.profile_pic_url)
                        ? <img src={user.profile_pic_url} alt="user profile" className={styles.profilePic}/>
                        : <img src={defaultPfp} alt="user profile" className={styles.profilePic}/>}
                    </div>
                  </Link>
                  <button className={styles.login} onClick={handleLogoutClick} >Log Out</button>
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