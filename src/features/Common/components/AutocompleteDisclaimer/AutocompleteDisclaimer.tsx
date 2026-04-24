import { FC } from "react";
import styles from '@/features/Common/components/Autocomplete/Autocomplete.module.scss';
import BetaTag from '@/features/Common/components/BetaTag/BetaTag';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import { Link } from "react-router-dom";

const AutocompleteDisclaimer: FC = () => {
  return (
    <div
      className={`${styles.item} ${styles.disclaimer}`}
    >
      <BetaTag tagClassName={styles.betaTag}/>
      <span className={styles.disclaimerText}>Limited search terms supported. </span>
      <InfoIcon data-tooltip-id="autocomplete-disclaimer-tooltip"/>
      <Tooltip id="autocomplete-disclaimer-tooltip">
        <span>We currently support genes, diseases, phenotypes, and chemicals, as well as biological entities like processes, anatomical structures, and cell lines during the beta phase.</span>
        <Link to="/frequently-asked-questions#limited-queries" target="_blank" rel="noreferrer">Learn More</Link>
      </Tooltip>
    </div>
  )
}

export default AutocompleteDisclaimer;