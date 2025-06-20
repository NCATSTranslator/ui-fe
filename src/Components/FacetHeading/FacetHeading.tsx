import { FC, ReactNode } from "react";
import styles from "./FacetHeading.module.scss";
import Tooltip from '../Tooltip/Tooltip';
import Alert from '../../Icons/Status/Alerts/Info.svg?react';
import ChevDown from "../../Icons/Directional/Chevron/Chevron Down.svg?react";
import { Filter } from "../../Types/filters";
import { filterFamily } from "../../Utilities/filterFunctions";

type FacetHeadingProps = {
  title: string;
  tagFamily: string;
  activeFilters: Filter[];
  children?: ReactNode;
}

const FacetHeading: FC<FacetHeadingProps> = ({ title, tagFamily, activeFilters, children }) => {

  const matchingActiveFacets = activeFilters.filter((filter)=> filterFamily(filter) === tagFamily).length;

  return (
    <div className={`${styles.labelContainer}`}>
      <div className={styles.labelHeading}>
        <div className={styles.label}>
          <span data-tooltip-id={`${tagFamily}-type-tooltip`} className={styles.heading}>
            <p className={`${styles.subTwo}`}>{title}</p>
            {
              children && <Alert className={styles.tooltipIcon}/>
            }
          </span>
          { matchingActiveFacets > 0 && <span className={styles.filterCount}>{matchingActiveFacets} {matchingActiveFacets === 1 ? "Filter" : "Filters"}</span>}
          <Tooltip id={`${tagFamily}-type-tooltip`}>
            {
              children
            }
          </Tooltip>
        </div>
        {
          tagFamily !== "str" &&
          <ChevDown className={styles.expansionSVG}/>
        }
      </div>
    </div>
  );
}

export default FacetHeading;
