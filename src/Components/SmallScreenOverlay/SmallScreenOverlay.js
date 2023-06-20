import styles from './SmallScreenOverlay.module.scss';

const SmallScreenOverlay = () => {

  return(
    <div className={styles.smallScreenOverlay}>
      <div className={styles.container}>
        <h5>Translator is intended to be used in a tablet or desktop environment due to the complex nature of our data and interactions.</h5>
        <p>Please open the site on a device with a larger screen in order to experience all Translator has to offer.</p>
      </div>
    </div>
  )
}

export default SmallScreenOverlay;