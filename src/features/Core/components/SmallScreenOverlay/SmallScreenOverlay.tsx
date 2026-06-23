import styles from './SmallScreenOverlay.module.scss';

const SmallScreenOverlay = () => {

  return(
    <div className={styles.smallScreenOverlay}>
      <div className={styles.container}>
        <h5>Translator is intended to be used in a widescreen view due to the complex nature of our data and interactions.</h5>
        <p>If you're on a desktop or laptop, try increasing the size of your browser window. </p>
        <p>If you're using a tablet, try rotating it into a landscape orientation.</p>
        <p>If you're on mobile, please open the site on a device with a larger screen in order to experience all Translator has to offer.</p>
      </div>
    </div>
  )
}

export default SmallScreenOverlay;