import styles from './SmallScreenOverlay.module.scss';

const SmallScreenOverlay = () => {

  return(
    <div className={styles.smallScreenOverlay}>
      <div className={styles.container}>
        <h5>Translator is intended to be used in a tablet or desktop environment due to the complex nature of our data and interactions.</h5>
        <p>If you are using a tablet, try rotating it into a landscape orientation. If you're on mobile, please open the site on a device with a larger screen in order to experience all Translator has to offer.</p>
      </div>
    </div>
  )
}

export default SmallScreenOverlay;