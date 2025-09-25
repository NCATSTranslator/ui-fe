import styles from './FacetTag.module.scss';
import { FC } from "react";
import { Filter } from "@/features/ResultFiltering/types/filters";
import FacetCheckbox from "@/features/ResultFiltering/components/FacetCheckbox/FacetCheckbox";
import { formatBiolinkEntity } from "@/features/Common/utils/utilities";
import Include from '@/assets/icons/buttons/Checkmark/Circle Checkmark.svg?react';
import Exclude from '@/assets/icons/buttons/View & Exclude/Exclude.svg?react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { cloneDeep } from 'lodash';

interface FacetTagProps {
  activeFilters: Filter[];
  family: string;
  filterObject: [string, Filter];
  handleInteractExistingEntity?: (filter: Filter, currentChecked: boolean, currentClicked: boolean) => void;
  isEntitySearch?: boolean;
  onFilter: (arg: Filter) => void;
}

const handleFacetChange = (onFilter: (arg: Filter) => void, filterID: string, filter: Filter, negated: boolean = false, label: string = '') => {
  if (filter.id === filterID) {
    return;
  }

  const newTag = cloneDeep(filter);
  newTag.id = filterID;
  newTag.value = label;
  newTag.negated = negated;
  onFilter(newTag);
}

const getRoleLinkout = (tagKey: string): string => {
  const id = tagKey.split(':').slice(1,).join('%3A');
  return `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${id}`;
}

const generateTagName = (isEntitySearch: boolean, filter: Filter, family: string) => {
  let tagName = "";
  if(isEntitySearch)
    tagName = (!!filter?.value) ? `"${filter.value}"` : filter.name;
  else
    tagName = (family === 'pc') ? formatBiolinkEntity(filter.name) : filter.name;

  return tagName;
}

const getIsChecked = (isEntitySearch: boolean, activeFilters: Filter[], tagKey: string, isNegated: boolean, filter: Filter) => {
  let checked = false;
  if(isEntitySearch)
    checked = (activeFilters.some(fil => fil.value === filter.value && !!fil?.negated === isNegated)) ? true: false;
  else
    checked = (activeFilters.some(fil => fil.id === tagKey && !!fil?.negated === isNegated)) ? true: false;

  return checked;
}

const FacetTag: FC<FacetTagProps> = ({
  activeFilters,
  family,
  filterObject,
  handleInteractExistingEntity,
  isEntitySearch = false,
  onFilter}) => {

  let tagKey = filterObject[0];
  let filter = filterObject[1];
  let tagName: string = generateTagName(isEntitySearch, filter, family);
  let positiveChecked = getIsChecked(isEntitySearch, activeFilters, tagKey, false, filter);
  let negativeChecked = getIsChecked(isEntitySearch, activeFilters, tagKey, true, filter);

  return (
    <div className={`facet-container ${styles.facetContainer} ${positiveChecked ? styles.containerPositiveChecked : ""} ${negativeChecked ? styles.containerNegativeChecked : ""}`} key={tagKey} data-facet-name={tagName}>
      <FacetCheckbox
        handleClick={
          isEntitySearch && !!handleInteractExistingEntity
          ? () => handleInteractExistingEntity(filter, positiveChecked, true)
          : () => handleFacetChange(onFilter, tagKey, filter, false, tagName)
        }
        checked={positiveChecked}
        className={`${styles.checkbox} ${styles.positive}`}
        checkedClassName={positiveChecked ? styles.positiveChecked : ""}
        icon={<Include/>}
        labelLeft
        title="Include"
        >
        <span className={styles.tagName} title={tagName}>
          {tagName}
        </span>
        {
          !isEntitySearch &&
          <span className={styles.facetCount}>
            {(filter.count) ? filter.count : 0}
            {
            (family === "role") &&
              <a href={getRoleLinkout(tagKey)} rel="noreferrer" target="_blank">
                <ExternalLink className={styles.extLinkIcon}/>
              </a>
            }
          </span>
        }
      </FacetCheckbox>
      <FacetCheckbox
        handleClick={
          isEntitySearch && !!handleInteractExistingEntity
          ? () => handleInteractExistingEntity(filter, negativeChecked, true)
          : () => handleFacetChange(onFilter, tagKey, filter, true, tagName)
        }
        checked={negativeChecked}
        className={`${styles.checkbox} ${styles.negative}`}
        checkedClassName={negativeChecked ? styles.negativeChecked : ""}
        icon={<Exclude/>}
        labelLeft
        title="Exclude"
      ></FacetCheckbox>
    </div>
  )
}

export default FacetTag;
