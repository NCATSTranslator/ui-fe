import { Link, useLocation } from 'react-router-dom';
import Tooltip from '../Tooltip/Tooltip';
import { currentConfig, currentRoot, currentUser } from "../../Redux/rootSlice";
import { useSelector } from "react-redux";
import Logo from '../../Assets/Images/Logo.svg?react';
import History from '../../Icons/Navigation/History.svg?react';
import Feedback from '../../Icons/Navigation/Feedback.svg?react';
import Workspace from '../../Icons/Navigation/Workspace.svg?react';
import Question from '../../Icons/Navigation/Question.svg?react';
import defaultPfp from '../../Assets/Images/pfp.png';
import styles from './Header.module.scss';
import { getGeneratedSendFeedbackLink } from '../../Utilities/utilities';

const Header = ({children}) => {
  
  const root = useSelector(currentRoot);
  const user = useSelector(currentUser);
  const config = useSelector(currentConfig);
  const location = useLocation();

  const clientID = config?.social_providers?.una?.client_id;
  const redirectURI = `${window.location.origin}/main/logout`;
  const logoutURI = config?.social_providers?.una?.logout_uri;
  const logoutReady = (clientID && logoutURI) ? true : false;
  const openFeedbackModal = true;

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.left}>
            <Link to={`/${root}/`} className={styles.logo} reloadDocument={location.pathname === "/main/results" ? false : true}><Logo/></Link>
          </div>
          <div className={styles.right}>
            {
              root === 'main' &&
              <>
                <Link to={`/${root}/workspace`} className={styles.workspaceLink}><Workspace/><span className={styles.linkSpan}>Workspace</span></Link>
                <Link to={`/${root}/history`}><History/><span className={styles.linkSpan}>Search History</span></Link>
              </>
            }
            <Link to={`${getGeneratedSendFeedbackLink(openFeedbackModal, root)}`} reloadDocument target={'_blank'}><Feedback/><span className={styles.linkSpan}>Send Feedback</span></Link>
            <Link to={`/${root}/help`} className={styles.helpLink} rel="noreferrer" target={'_blank'} ><Question/><span className={styles.linkSpan}>Help</span></Link>
            {
              root === 'demo'
              ? 
                <Link to={`/main`} className={styles.login} reloadDocument>Log In</Link>
              : 
                <>
                  <Link to={`/main/home`} data-tooltip-id={`prefs-tooltip`} aria-describedby={`prefs-tooltip`} className={styles.userIcon}>
                    <div className={styles.imageContainer}>
                      {(user?.profile_pic_url)
                        ? <img src={user.profile_pic_url} alt="user profile" className={styles.profilePic}/>
                        : <img src={defaultPfp} alt="user profile" className={styles.profilePic}/>}
                    </div>
                    <Tooltip id={`prefs-tooltip`} place="bottom">
                      <span className={styles.tooltip}>Click here to view and edit your user preferences.</span>
                    </Tooltip>
                  </Link>
                  {
                    logoutReady && 
                    <form method="post" action={logoutURI}>
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