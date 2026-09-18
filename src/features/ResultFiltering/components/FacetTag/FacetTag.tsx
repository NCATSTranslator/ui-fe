import styles from './FacetTag.module.scss';
import { FC } from "react";
import { Filter } from "@/features/ResultFiltering/types/filters";
import FacetCheckbox from "@/features/ResultFiltering/components/FacetCheckbox/FacetCheckbox";
import { formatBiolinkEntity } from "@/features/Core/utils/stringFormatters";
import { joinClasses } from "@/features/Core/utils/classHelpers";
import Include from '@/assets/icons/buttons/Checkmark/Circle Checkmark.svg?react';
import Exclude from '@/assets/icons/buttons/View & Exclude/Exclude.svg?react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { getTagType, FILTERING_CONSTANTS, formatPredicateFilterName } from '@/features/ResultFiltering/utils/filterFunctions';
import AcceptedOntologyTooltip from '@/features/ResultFiltering/components/AcceptedOntologyTooltip/AcceptedOntologyTooltip';

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

  onFilter({ ...filter, id: filterID, value: label, negated });
}

const getRoleLinkout = (tagKey: string): string => {
  const id = tagKey.split(':').slice(1,).join('%3A');
  return `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${id}`;
}

const generateTagName = (isEntitySearch: boolean, filter: Filter, family: string) => {
  let tagName = "";
  if(isEntitySearch)
    tagName = (!!filter?.value) ? `"${filter.value}"` : filter.name;
  else if (family === 'pc')
    tagName = formatBiolinkEntity(filter.name);
  else if (family === 'pred')
    tagName = formatPredicateFilterName(filter.name);
  else
    tagName = filter.name;

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

const getTagNameClass = (tagKey: string) => joinClasses(
  styles.tagName,
  (tagKey.includes('r/role') || tagKey.includes('r/ara')) && styles.roleTagName,
  (tagKey.includes('p/pred') && styles.predicateTagName),
);

interface FacetClickHandlerArgs {
  filter: Filter;
  tagKey: string;
  tagName: string;
  negated: boolean;
  checked: boolean;
  isEntitySearch: boolean;
  onFilter: FacetTagProps['onFilter'];
  handleInteractExistingEntity: FacetTagProps['handleInteractExistingEntity'];
}

const getFacetClickHandler = ({
  filter,
  tagKey,
  tagName,
  negated,
  checked,
  isEntitySearch,
  onFilter,
  handleInteractExistingEntity,
}: FacetClickHandlerArgs) => (
  isEntitySearch && !!handleInteractExistingEntity
    ? () => handleInteractExistingEntity(filter, checked, true)
    : () => handleFacetChange(onFilter, tagKey, filter, negated, tagName)
);

interface FacetCountProps {
  count?: number;
  family: string;
  tagKey: string;
}

const FacetCount: FC<FacetCountProps> = ({ count, family, tagKey }) => (
  <span className={styles.facetCount}>
    {(count) ? count : 0}
    {
    (family === "role") &&
      <a href={getRoleLinkout(tagKey)} rel="noreferrer" target="_blank">
        <ExternalLink className={styles.extLinkIcon}/>
      </a>
    }
  </span>
);

const FacetTag: FC<FacetTagProps> = ({
  activeFilters,
  family,
  filterObject,
  handleInteractExistingEntity,
  isEntitySearch = false,
  onFilter,
}) => {

  let [tagKey, filter] = filterObject;
  let tagName: string = generateTagName(isEntitySearch, filter, family);
  let positiveChecked = getIsChecked(isEntitySearch, activeFilters, tagKey, false, filter);
  let negativeChecked = getIsChecked(isEntitySearch, activeFilters, tagKey, true, filter);
  const type = getTagType(tagKey);
  const shouldShowCount = !isEntitySearch && type !== FILTERING_CONSTANTS.PATH;
  const isAcceptedOntology = tagKey.includes('p/ev/ontology');
  const clickHandlerArgs = { filter, tagKey, tagName, isEntitySearch, onFilter, handleInteractExistingEntity };

  const classNames = joinClasses(
    styles.facetContainer,
    positiveChecked ? styles.containerPositiveChecked : "",
    negativeChecked ? styles.containerNegativeChecked : "",
  );

  return (
    <div className={classNames} key={tagKey} data-facet-name={tagName}>
      <FacetCheckbox
        handleClick={getFacetClickHandler({ ...clickHandlerArgs, negated: false, checked: positiveChecked })}
        checked={positiveChecked}
        className={`${styles.checkbox} ${styles.positive}`}
        checkedClassName={positiveChecked ? styles.positiveChecked : ""}
        icon={<Include/>}
        labelLeft
        title="Include"
        >
        <span
          className={getTagNameClass(tagKey)}
          title={tagName}
        >
          {tagName}
          {
            isAcceptedOntology && <AcceptedOntologyTooltip/>
          }
        </span>
        {
          shouldShowCount &&
          <FacetCount count={filter.count} family={family} tagKey={tagKey} />
        }
      </FacetCheckbox>
      <FacetCheckbox
        handleClick={getFacetClickHandler({ ...clickHandlerArgs, negated: true, checked: negativeChecked })}
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
