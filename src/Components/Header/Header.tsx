import { FC, ReactNode } from 'react';
import { Link, useLocation, Location } from 'react-router-dom';
import { currentConfig, currentUser } from "../../Redux/rootSlice";
import { useSelector } from "react-redux";
import { useWindowSize } from '../../Utilities/customHooks';
import History from '../../Icons/Navigation/History.svg?react';
import Feedback from '../../Icons/Navigation/Feedback.svg?react';
import Workspace from '../../Icons/Navigation/Workspace.svg?react';
import Question from '../../Icons/Navigation/Help.svg?react';
import Cog from '../../Icons/Navigation/Settings.svg?react';
import Logo from '../../Assets/Images/site-logo.png';
import styles from './Header.module.scss';
import { getGeneratedSendFeedbackLink, getFullPathname } from '../../Utilities/utilities';

type HeaderProps = {
  children?: ReactNode;
}

const getFormattedLoginURL = (location: Location): string => {
  let url = `/login?path=${encodeURIComponent(getFullPathname(location))}`;
  return url;
}

const Header: FC<HeaderProps> = ({children}) => {
  
  const user = useSelector(currentUser);
  const config = useSelector(currentConfig);
  const location = useLocation();
  const {width} = useWindowSize();
  const collapseNameScreenWidth = 1270;
  const clientID = config?.social_providers?.una?.client_id;
  const logoutURI = config?.social_providers?.una?.logout_uri;
  const logoutReady = (clientID && logoutURI) ? true : false;
  const openFeedbackModal = true;
  const postLogoutRedirectUri = `${window.location.protocol}//${window.location.host}/logout`;
  const loginURL = getFormattedLoginURL(location);
  const currentPage = location.pathname;

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.left}>
            <Link to={`/`} className={styles.logo} reloadDocument={location.pathname === "/main/results" ? false : true}>
              <img src={Logo} alt="Translator Logo" />
            </Link>
          </div>
          <div className={styles.right}>
            {
              !!user &&
              <>
                <Link to={`/workspace`} className={`${currentPage.includes("workspace") && styles.active} ${styles.workspaceLink}`}><Workspace/><span className={styles.linkSpan}>Workspace</span></Link>
                <Link to={`/history`} className={`${currentPage.includes("history") && styles.active}`}><History/><span className={styles.linkSpan}>Search History</span></Link>
              </>
            }
            <Link to={`${getGeneratedSendFeedbackLink(openFeedbackModal)}`} reloadDocument target={'_blank'}><Feedback/><span className={styles.linkSpan}>Send Feedback</span></Link>
            <Link to={`/help`}  className={`${currentPage.includes("help") && styles.active} ${styles.helpLink}`} rel="noreferrer" target={'_blank'} ><Question/><span className={styles.linkSpan}>Help</span></Link>
            {
              !user 
              ? 
                <a className={styles.login} href={!!loginURL ? loginURL : ''}>Log In</a>
              : 
                <>
                  <Link to={`/preferences`} className={`${currentPage.includes("preferences") && styles.active} ${styles.userIcon}`}>
                    <Cog/>
                    {
                      user?.name && !!width &&
                      <span className={`${width <= collapseNameScreenWidth ? styles.hide : ''} ${styles.userName} ${styles.linkSpan}`}>Preferences</span>
                    }
                  </Link>
                  {
                    logoutReady && 
                    <form method="post" action={logoutURI}>
                      <input type="hidden" name="client_id" value={clientID} />
                      <input type="hidden" name="show_prompt" value="false" />
                      <input type="hidden" name="post_logout_redirect_uri" value={postLogoutRedirectUri}/> 
                      <button type="submit" value="submit" className={`${styles.logout} ${styles.login}`}>Log Out</button>
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