import styles from './LoginComponent.module.scss'
import tempImage from '../../Assets/Images/Home/home1.jpg';

const LoginComponent = () => {
  
  return(
    <div className={styles.loginContainer}>
      <div className={styles.left}>
        <img src={tempImage} alt="Decorative image for login page." />
        <p>An exploration tool integrating trusted data sources, which aids researchers in discovering novel connections representing biomedical knowledge.</p>
      </div>
      <div className={styles.right}>
        <h2 className={styles.heading}>Welcome!</h2>
        <p className={styles.blurb}>Sign in to access your Translator account.</p>
        <button className={styles.continueButton}>Continue</button>
      </div>
    </div>
  );
}

export default LoginComponent;