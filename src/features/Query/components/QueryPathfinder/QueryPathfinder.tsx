import { useState, useRef, FC } from 'react';
import styles from './QueryPathfinder.module.scss';
import Button from '@/features/Core/components/Button/Button';
import { AutocompleteItem, AutocompleteContext } from '@/features/Query/types/querySubmission';
import ArrowRight from "@/assets/icons/directional/Arrows/Arrow Right.svg?react";
import PathfinderDivider from "@/assets/icons/directional/Pathfinder/Pathfinder.svg?react";
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import SubtractIcon from '@/assets/icons/buttons/Subtract/Subtract.svg?react';
import loadingIcon from '@/assets/images/loading/loading-white.png';
import Select from '@/features/Core/components/Select/Select';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import { useQuerySubmission, useNameResolverEndpoint, HOME_QUERY_AUTOCOMPLETE_CONFIG } from '@/features/Query/hooks/customQueryHooks';
import { usePathfinderTerms, PathfinderTerm } from '@/features/Query/hooks/usePathfinderTerms';
import { validatePathfinderTerms } from '@/features/Query/utils/pathfinderValidation';
import { noop } from '@/features/Core/utils/constants';
import AutocompleteInput from '@/features/Query/components/AutocompleteInput/AutocompleteInput';
import { ProjectRaw } from '@/features/Projects/types/projects';
import { BIOLINK_CATEGORIES } from '@/features/Query/utils/biolinkCategories';
import { User } from '@/features/UserAuth/types/user';

type QueryPathfinderProps = {
  isResults?: boolean;
  selectedProject?: ProjectRaw | null;
  shouldNavigate?: boolean;
  submissionCallback?: () => void;
  user?: User | null;
  initNodeIdParam?: string | null;
  initNodeLabelParam?: string | null;
  initNodeCategoryParam?: string | null;
}

const QueryPathfinder: FC<QueryPathfinderProps> = ({
  isResults = false,
  selectedProject = null,
  shouldNavigate = true,
  submissionCallback = noop,
  user = null,
  initNodeIdParam = null,
  initNodeLabelParam = null,
  initNodeCategoryParam = null,
}) => {

  const autocompleteOneId = 'ac1';
  const autocompleteTwoId = 'ac2';
  const disabled = user === null;
  const nameResolverEndpoint = useNameResolverEndpoint();
  const submitRef = useRef<HTMLButtonElement>(null);
  const [isError, setIsError] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [hasMiddleType, setHasMiddleType] = useState<boolean>(false);
  const [middleType, setMiddleType] = useState<string>("");

  const { one, two, swapTerms } = usePathfinderTerms(
    { nodeId: initNodeIdParam, nodeLabel: initNodeLabelParam, nodeCategory: initNodeCategoryParam },
    HOME_QUERY_AUTOCOMPLETE_CONFIG,
    nameResolverEndpoint,
  );
  const { isLoading, submitPathfinderQuery } = useQuerySubmission('pathfinder', shouldNavigate, submissionCallback);

  const selectTerm = (term: PathfinderTerm, item: AutocompleteItem) => {
    setIsError(false);
    term.onItemSelect(item);
  };

  // Event handler for form submission
  const handleSubmission = () => {
    const validation = validatePathfinderTerms(one.queryItem, two.queryItem);
    if (!validation.ok) {
      setIsError(true);
      setErrorText(validation.error);
      return;
    }
    submitPathfinderQuery?.(validation.itemOne, validation.itemTwo, hasMiddleType ? middleType : undefined, selectedProject?.id?.toString() || undefined);
  };

  const handleMiddleTypeTrigger = () => {
    if(hasMiddleType) {
      setMiddleType("");
    } else {
      setMiddleType("biolink:ChemicalEntity");
    }
    setHasMiddleType(prev => !prev);
  }

  const handleAutocompleteSelect = (cxt: AutocompleteContext) => {
    if (cxt.id === autocompleteOneId) {
      two.inputRef.current?.focus();
    } else if (cxt.id === autocompleteTwoId) {
      submitRef.current?.focus();
    } else {
      throw Error(`Developer Error in QueryPathfinder.tsx: In handleAutocompleteSelect\n  cxt.id: ${cxt.id}`);
    }
  }

  const handleInputSubmit = (cxt: AutocompleteContext) => {
    if (cxt.event === undefined || cxt.event === null) {
      throw Error(`Developer Error in QueryPathfinder.tsx: \n  In handleInputSubmit cxt.event is required but is ${cxt.event}`);
    }
    cxt.event.preventDefault();
    cxt.event.stopPropagation();
    handleSubmission();
  }

  return (
    <div className={`${styles.queryPathfinder} ${isResults && styles.results}`}>
      { isResults
        ? null
        :
          <>
            <p className={`blurb ${styles.blurb}`}>Enter two search terms to find paths beginning with the first term and ending with the second</p>
            {
              isError &&
              <p className={styles.error}>{errorText}</p>
            }
            <form
              className={`${styles.form} ${hasMiddleType && styles.hasMiddleType}`}
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmission();
              }}
            >
              <AutocompleteInput
                id={autocompleteOneId}
                value={one.inputText}
                onChange={one.onChange}
                onItemSelect={(item) => selectTerm(one, item)}
                autocompleteItems={one.autocompleteItems}
                loadingAutocomplete={one.loadingAutocomplete}
                selectedItem={one.queryItem}
                onClear={one.onClear}
                className={styles.inputContainer}
                selectedClassName={styles.selected}
                autocompleteVisibility={one.autocompleteVisibility}
                setAutocompleteVisibility={one.setAutocompleteVisibility}
                disabled={disabled}
                placeholder={user === null ? "Log In to Enter Search Terms" : "Enter First Search Term"}
                handleSelect={handleAutocompleteSelect}
                handleSubmit={handleInputSubmit}
                inputRef={one.inputRef}
                handleSwapTerms={swapTerms}
                showDisclaimer
              />
              <PathfinderDivider className={styles.dividerIcon}/>
              {
                hasMiddleType
                ?
                  <>
                    <Button iconOnly iconLeft={<SubtractIcon/>} handleClick={handleMiddleTypeTrigger} variant="secondary" dataTooltipId='middle-type-tooltip' />
                    <Select
                      label=""
                      name="Type"
                      handleChange={(value)=>{
                        setMiddleType(value.toString());
                      }}
                      value={middleType ?? ""}
                      noanimate
                      className={styles.middleTypeSelector}
                      >
                      {BIOLINK_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </Select>
                  </>
                : 
                  <Button iconOnly iconLeft={<AddIcon/>} handleClick={handleMiddleTypeTrigger} variant="secondary" dataTooltipId='middle-type-tooltip' />
              }
              <PathfinderDivider className={styles.dividerIcon}/>
              <AutocompleteInput
                id={autocompleteTwoId}
                value={two.inputText}
                onChange={two.onChange}
                onItemSelect={(item) => selectTerm(two, item)}
                autocompleteItems={two.autocompleteItems}
                loadingAutocomplete={two.loadingAutocomplete}
                selectedItem={two.queryItem}
                onClear={two.onClear}
                className={styles.inputContainer}
                selectedClassName={styles.selected}
                autocompleteVisibility={two.autocompleteVisibility}
                setAutocompleteVisibility={two.setAutocompleteVisibility}
                disabled={disabled}
                placeholder={user === null ? "Log In to Enter Search Terms" : "Enter Second Search Term"}
                handleSelect={handleAutocompleteSelect}
                handleSubmit={handleInputSubmit}
                inputRef={two.inputRef}
                showDisclaimer
              />
              <Button
                ref={submitRef}
                type='submit'
                className={styles.submitButton}
                iconOnly
                disabled={disabled}
              >
                {
                  isLoading
                  ?
                    <img
                      src={loadingIcon}
                      className={`loadingIcon`}
                      alt="loading icon"
                    />
                  :
                    <ArrowRight/>
                }
              </Button>
            </form>
            <Tooltip
              id='middle-type-tooltip'
              >
                <span>Pre-filter results by selecting a middle object type to be included within paths between the entered search terms. <br/><br/> Genes, diseases, phenotypes, and chemicals are currently supported.</span>
            </Tooltip>
          </>
      }
    </div>
  );
}

export default QueryPathfinder;
