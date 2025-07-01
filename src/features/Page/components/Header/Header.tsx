import { FC, ReactNode } from 'react';
import { Link, useLocation, Location } from 'react-router-dom';
import { currentConfig, currentUser } from "@/features/UserAuth/slices/userSlice";
import { useSelector } from "react-redux";
import { useWindowSize } from "@/features/Common/utils/customHooks";
import History from '@/assets/icons/navigation/History.svg?react';
import Feedback from '@/assets/icons/navigation/Feedback.svg?react';
import Workspace from '@/assets/icons/navigation/Workspace.svg?react';
import Question from '@/assets/icons/navigation/Help.svg?react';
import Cog from '@/assets/icons/navigation/Settings.svg?react';
import Logo from '@/assets/images/site-logo.png';
import styles from './Header.module.scss';
import { getFullPathname, getDataFromQueryVar } from '@/features/Common/utils/utilities';

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
  const postLogoutRedirectUri = `${window.location.protocol}//${window.location.host}/logout`;
  const loginURL = getFormattedLoginURL(location);
  const currentPage = location.pathname;
  const currentARSpk = getDataFromQueryVar("q");

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.left}>
            <Link to={`/`} className={styles.logo} reloadDocument={location.pathname === "/results" ? false : true}>
              <img src={Logo} alt="Translator Logo" />
            </Link>
          </div>
          <div className={styles.right}>
            {
              !!user &&
              <>
                <Link to={`/workspace`} className={`${currentPage === '/workspace' && styles.active} ${styles.workspaceLink}`}><Workspace/><span className={styles.linkSpan}>Workspace</span></Link>
                <Link to={`/history`} className={`${currentPage === '/history' && styles.active}`}><History/><span className={styles.linkSpan}>Search History</span></Link>
              </>
            }
            <Link to={`/send-feedback${!!currentARSpk ? `?q=${currentARSpk}` : ''}`} className={`${currentPage === '/send-feedback' && styles.active}`} reloadDocument target={'_blank'}><Feedback/><span className={styles.linkSpan}>Send Feedback</span></Link>
            <Link to={`/help`}  className={`${currentPage === '/help' && styles.active} ${styles.helpLink}`} rel="noreferrer" target={'_blank'} ><Question/><span className={styles.linkSpan}>Help</span></Link>
            {
              !user 
              ? 
                <a className={styles.login} href={!!loginURL ? loginURL : ''}>Log In</a>
              : 
                <>
                  <Link to={`/preferences`} className={`${currentPage === '/preferences' && styles.active} ${styles.userIcon}`}>
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