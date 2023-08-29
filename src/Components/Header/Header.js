import React from "react";
import { Link } from 'react-router-dom';
import { currentConfig, currentRoot, currentUser } from "../../Redux/rootSlice";
import { useSelector } from "react-redux";
import {ReactComponent as Logo} from '../../Assets/Images/Logo.svg';
import {ReactComponent as History} from '../../Icons/Navigation/History.svg';
import {ReactComponent as Feedback} from '../../Icons/Navigation/Feedback.svg';
import {ReactComponent as Workspace} from '../../Icons/Navigation/Workspace.svg';
import {ReactComponent as Question} from '../../Icons/Navigation/Question.svg';
import defaultPfp from '../../Assets/Images/pfp.png';
import styles from './Header.module.scss';

const Header = ({children, handleFeedbackModalOpen}) => {
  
  const root = useSelector(currentRoot);
  const user = useSelector(currentUser);
  const config = useSelector(currentConfig);

  const clientID = config?.social_providers?.una?.client_id;
  const redirectURI = `${window.location.origin}/main/logout`;
  const logoutReady = (clientID) ? true : false;

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
                  {
                    logoutReady && 
                    <form method="post" action={"https://a-ci.ncats.io:443/_api/auth/transltr/session/end"}>
                      <input type="hidden" name="client_id" value={clientID} />
                      <input type="hidden" name="show_prompt" value="false" />
                      <input type="hidden" name="post_logout_redirect_uri" value={redirectURI}/> 
                      <button type="submit" value="submit" className={styles.login}>Log Out</button>
                    </form>
                  }
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