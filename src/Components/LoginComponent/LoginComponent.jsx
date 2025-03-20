import styles from './LoginComponent.module.scss'
import loginImage from '../../Assets/Images/login.png';
import { useSelector } from 'react-redux';
import { currentConfig } from '../../Redux/userSlice';

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
      </div>
    </div>
  );
}

export default LoginComponent;