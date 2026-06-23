import { FC, useMemo, useId, useCallback, MouseEvent } from "react";
import styles from "./FacetHeading.module.scss";
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import Alert from '@/assets/icons/status/Alerts/Info.svg?react';
import ChevRight from "@/assets/icons/directional/Chevron/Chevron Right.svg?react";
import { Filter } from "@/features/ResultFiltering/types/filters";
import { getFilterFamily, handleClearFamily } from "@/features/ResultFiltering/utils/filterFunctions";
import { joinClasses } from "@/features/Core/utils/classHelpers";

// module level tooltip markup constants
const roleTooltipMarkup = (
  <span className={styles.roleSpan}>The Chemical Entities of Biological Interest Role Classification (ChEBI role ontology, <a onClick={(e)=>{e.stopPropagation();}} href="https://www.ebi.ac.uk/chebi/chebiOntology.do?chebiId=CHEBI:50906&treeView=true#vizualisation" target="_blank" rel="noreferrer" className={styles.tooltipLink}>click to learn more</a>) is a chemical classification that categorizes chemicals according to their biological role, chemical role or application.</span>
)
const pcTooltipMarkup = (
  <span className={styles.fdaSpan}>Click <a onClick={(e)=>{e.stopPropagation();}} href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9372416/" target="_blank" rel='noreferrer' className={styles.tooltipLink}> here</a> to learn more about the Biolink Model.</span>
)
const ccTooltipMarkup = (
  <>
    <span className={styles.tooltipParagraph}>
      Drug is a substance intended for use in the diagnosis, cure, mitigation, treatment, or the prevention of a disease.<br/><br/>
      Phase 1-3 Drugs are chemicals that are part of a clinical trial and do not yet have FDA approval.<br/><br/>
      Other includes all other chemicals.
    </span>
  </>
)

type FacetHeadingProps = {
  className?: string;
  titleClassName?: string;
  includeArrow?: boolean;
  title: string;
  tagFamily: string;
  activeFilters: Filter[];
  onSetFilters: (filters: Filter[]) => void;
  isBackButton?: boolean;
}

const FacetHeading: FC<FacetHeadingProps> = ({
  className,
  titleClassName,
  includeArrow = true,
  title,
  tagFamily,
  activeFilters,
  onSetFilters,
  isBackButton = false,
}) => {
  const tooltipId = useId();
  const matchingActiveFacets = activeFilters.filter((filter)=> getFilterFamily(filter) === tagFamily).length;
  const shouldShowClearButton = matchingActiveFacets > 0 && (isBackButton || tagFamily === "str");
  const isChebiRoleFamily = tagFamily === "role";

  const tooltipMarkup = useMemo(() => {
    switch(tagFamily) {
      case 'role':
        return roleTooltipMarkup;
      case 'pc':
        return pcTooltipMarkup;
      case 'cc':
        return ccTooltipMarkup;
      default:
        return null;
    }
  }, [tagFamily]);

  const matchingActiveFacetsMarkup = <span className={styles.filterCount}>{matchingActiveFacets}</span>;

  const clearFamily = useCallback((e: MouseEvent<HTMLSpanElement>, family: string) => {
    e.stopPropagation();
    handleClearFamily(family, activeFilters, onSetFilters);
  }, [activeFilters, onSetFilters]);

  const classNames = joinClasses(
    styles.labelContainer,
    className,
  );

  const combinedTitleClassName = joinClasses(
    styles.subTwo,
    shouldShowClearButton && styles.hasClearButton,
    isChebiRoleFamily && styles.chebiRoleFamily,
    titleClassName,
  );

  const labelHeadingClassName = joinClasses(
    styles.labelHeading,
    includeArrow && styles.includeArrow,
  );

  return (
    <div className={classNames}>
      <div className={labelHeadingClassName}>
        <div className={styles.label}>
          <span data-tooltip-id={tooltipId} className={styles.heading}>
            <p className={combinedTitleClassName}>{title}</p>
            {
              tooltipMarkup !== null && <Alert className={styles.tooltipIcon}/>
            }
          </span>
          <div className={styles.filterCountContainer}>
            { (matchingActiveFacets > 0) && matchingActiveFacetsMarkup}
            { shouldShowClearButton && <span className={styles.clearButton} onClick={(e) => clearFamily(e, tagFamily)}>Clear</span> }
          </div>
          {
            tooltipMarkup !== null &&
            <Tooltip id={tooltipId} place="bottom">
              {
                tooltipMarkup
              }
            </Tooltip>
          }
        </div>
        {
          (tagFamily !== "str" && includeArrow) &&
          <ChevRight className={styles.expansionSVG}/>
        }
      </div>
    </div>
  );
}

export default FacetHeading;
