import styles from './LoginComponent.module.scss'
import loginImage from '../../Assets/Images/login.png';
import { useSelector } from 'react-redux';
import { currentConfig } from '../../Redux/rootSlice';

const LoginComponent = () => {

  const config = useSelector(currentConfig);
  const socialProviders = (config?.social_providers) ? config.social_providers: null;
  const unaConfig = socialProviders ? socialProviders.una : null;
  const loginURL = unaConfig ? `${unaConfig.auth_uri}?response_type=code&client_id=${encodeURIComponent(unaConfig.client_id)}&scope=${encodeURIComponent(unaConfig.scope)}&redirect_uri=${encodeURIComponent(unaConfig.redirect_uri)}`
    : null;

    return(
    <div className={styles.loginContainer}>
      <div className={styles.left}>
        <img src={loginImage} alt="Decorative for login page." />
        <p>An exploration tool integrating trusted data sources, which aids researchers in discovering novel connections representing biomedical knowledge.</p>
      </div>
      <div className={styles.right}>
        <h2 className={styles.heading}>Welcome!</h2>
        <p className={styles.blurb}>Sign in to access your Translator account.</p>
        <a className={styles.continueButton} href={loginURL}>Continue</a>
        {/* <ul>
        <li><a href="https://accounts.google.com/o/oauth2/v2/auth?client_id=993742507981-9f5sm5tctipak3c4v044gjfd7rmps8jt.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A8386%2Foauth2%2Fredir%2Fgoogle&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20openid&access_type=offline">
              Sign in with Google (real)</a></li>
          <li><a href="https://www.facebook.com/v17.0/dialog/oauth?client_id=115637941549409&redirect_uri=http%3A%2F%2Flocalhost%3A8386%2Foauth2%2Fredir%2Ffacebook&state=whatevs&response_type=code%20granted_scopes&scope=email%20public_profile">Sign in with Facebook (NO LONGER REAL)</a></li>
        </ul> */}
      </div>
    </div>
  );
}

export default LoginComponent;