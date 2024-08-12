import { FC } from "react";
import styles from "./FacetHeading.module.scss";
import Tooltip from '../Tooltip/Tooltip';
import Alert from '../../Icons/Status/Alerts/Info.svg?react';
import ChevDown from "../../Icons/Directional/Chevron/Chevron Down.svg?react"

type FacetHeadingProps = {
  tagType: string;
  activeFilters: Filter[];
}

const FacetHeading: FC<FacetHeadingProps> = ({ tagType, activeFilters }) => {

  const matchingActiveFacets = activeFilters.filter((val)=> val.type.includes(tagType)).length;
  console.log(matchingActiveFacets, activeFilters)

  return (
    <div className={styles.labelContainer}>
    <div className={styles.labelHeading}>
      <div className={styles.label}>
        <span data-tooltip-id="chemical-type-tooltip" className={styles.heading}>
          <p className={`${styles.subTwo}`}>Chemical Categories</p>
          <Alert/>
          { matchingActiveFacets > 1 && <span className={styles.filterCount}>{matchingActiveFacets} Filter</span>}
        </span>
        <Tooltip id="chemical-type-tooltip">
          <p className={styles.tooltipParagraph}>Drug is a substance intended for use in the diagnosis, cure, mitigation, treatment, or the prevention of a disease.</p>
          <p className={styles.tooltipParagraph}>Phase 1-3 Drugs are chemicals that are part of a clinical trial and do not yet have FDA approval.</p>
          <p className={styles.tooltipParagraph}>Other includes all other chemicals.</p>
        </Tooltip>
      </div>
      <ChevDown className={styles.expansionSVG}/>
    </div>
  </div>
  );
}

export default FacetHeading;
