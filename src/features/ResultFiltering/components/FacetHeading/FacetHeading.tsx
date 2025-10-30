import { FC, ReactNode, useMemo } from "react";
import styles from "./FacetHeading.module.scss";
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import Alert from '@/assets/icons/status/Alerts/Info.svg?react';
import ChevRight from "@/assets/icons/directional/Chevron/Chevron Right.svg?react";
import { Filter } from "@/features/ResultFiltering/types/filters";
import { getFilterFamily } from "@/features/ResultFiltering/utils/filterFunctions";
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';

type FacetHeadingProps = {
  title: string;
  tagFamily: string;
  activeFilters: Filter[];
}

const FacetHeading: FC<FacetHeadingProps> = ({ title, tagFamily, activeFilters }) => {

  const matchingActiveFacets = activeFilters.filter((filter)=> getFilterFamily(filter) === tagFamily).length;

  const roleTooltipMarkup = (
    <span className={styles.roleSpan}>The Chemical Entities of Biological Interest Role Classification (ChEBI role ontology, <a onClick={(e)=>{e.stopPropagation();}} href="https://www.ebi.ac.uk/chebi/chebiOntology.do?chebiId=CHEBI:50906&treeView=true#vizualisation" target="_blank" rel="noreferrer" className={styles.tooltipLink}>click to learn more <ExternalLink/></a>) is a chemical classification that categorizes chemicals according to their biological role, chemical role or application.</span>
  )
  const pcTooltipMarkup = (
    <span className={styles.fdaSpan}>Click <a onClick={(e)=>{e.stopPropagation();}} href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9372416/" target="_blank" rel='noreferrer' className={styles.tooltipLink}> here <ExternalLink/></a> to learn more about the Biolink Model.</span>
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
  const txtTooltipMarkup = (
    <span className={styles.tooltip}>Search all textual elements (result name, description, node names, edge names) for a given string.</span>
  )

  const tooltipMarkup = useMemo(() => {
    switch(tagFamily) {
      case 'role':
        return roleTooltipMarkup;
      case 'pc':
        return pcTooltipMarkup;
      case 'cc':
        return ccTooltipMarkup;
      case 'txt':
        return txtTooltipMarkup;
      default:
        return null;
    }
  }, [tagFamily]);

  return (
    <div className={`${styles.labelContainer}`}>
      <div className={styles.labelHeading}>
        <div className={styles.label}>
          <span data-tooltip-id={`${tagFamily}-type-tooltip`} className={styles.heading}>
            <p className={`${styles.subTwo}`}>{title}</p>
            {
              tooltipMarkup !== null && <Alert className={styles.tooltipIcon}/>
            }
          </span>
          { matchingActiveFacets > 0 && <span className={styles.filterCount}>{matchingActiveFacets}</span>}
          {
            tooltipMarkup !== null &&
            <Tooltip id={`${tagFamily}-type-tooltip`}>
              {
                tooltipMarkup
              }
            </Tooltip>
          }
        </div>
        {
          tagFamily !== "str" &&
          <ChevRight className={styles.expansionSVG}/>
        }
      </div>
    </div>
  );
}

export default FacetHeading;
