import { useState } from 'react';
import styles from './Predicate.module.scss';
import ResearchSingle from '../../Icons/research-single.svg?react';
import ResearchMultiple from '../../Icons/research-multiple.svg?react';
import Up from '../../Icons/Directional/Property 1=Up.svg?react';
import Highlighter from 'react-highlight-words';
import { capitalizeAllWords, formatBiolinkEntity } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';
import SupportPathGroup from '../SupportPathGroup/SupportPathGroup';
import { cloneDeep } from 'lodash';

const Predicate = ({ pathObject, selected, activeStringFilters, uid, parentClass = '', handleEdgeClick, 
   hasSupport, supportDataObject = null, inModal = false }) => {

  pathObject.predicate = formatBiolinkEntity(pathObject.predicates[0]); 
  const pubCount = Object.values(pathObject.publications).reduce((sum, arr) => sum + arr.length, 0);
  const [isSupportExpanded, setIsSupportExpanded] = useState(true);

  const handleSupportExpansion = (e) => {
    e.stopPropagation();
    setIsSupportExpanded(prev=>!prev);
  }

  return (
    <>
      <span 
        className={`${selected ? styles.selected : ''} ${parentClass}`} 
        onClick={(e)=> {e.stopPropagation(); handleEdgeClick(pathObject);}}
        >
        <span className={`connector ${styles.connector} ${hasSupport ? styles.inferred : ''}`}></span>
        <span 
          className={`${styles.path} path ${(pathObject.predicates.length > 1) ? styles.hasMore : ''}`}
          data-tooltip-id={`${pathObject.predicate}${uid}`}
          >
          {
            pubCount > 1
            ? <ResearchMultiple />
            : (pubCount > 0 || pathObject.provenance?.length > 0) 
              ? <ResearchSingle /> 
              : '' 
          }
          <span>
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeStringFilters}
              autoEscape={true}
              textToHighlight={capitalizeAllWords(pathObject.predicate)}
            />

            {
              pathObject.predicates.length > 1 && 
              <span className={styles.more}>
                + {pathObject.predicates.length - 1} More
              </span>
            }
          </span>
        </span>
        {
          <Tooltip 
            id={`${pathObject.predicate}${uid}`}
            place={`${inModal ? 'left' : 'top' }`}
            > 
            {
              pathObject.predicates &&
              <div className={styles.predicatesList}>
                {
                  pathObject.predicates.map((predicate, i)=> {
                    return (
                      <p 
                        key={`${predicate}${uid}${i}`} 
                        className={`${styles.tooltipPredicate} ${inModal ? styles.inModal : ''}`} 
                        onClick={(e)=> {
                          e.stopPropagation(); 
                          const newPathObject = cloneDeep(pathObject);
                          newPathObject.predicate = predicate;
                          handleEdgeClick(newPathObject);
                        }}
                        >
                        <Highlighter
                          highlightClassName="highlight"
                          searchWords={activeStringFilters}
                          autoEscape={true}
                          textToHighlight={capitalizeAllWords(predicate)}
                        />
                      </p>
                    )
                  })
                }
              </div>
            }
          </Tooltip>
        }
        {
          hasSupport && 
          <button 
            onClick={(e)=>{handleSupportExpansion(e);}} 
            className={`${styles.supportExpansionButton} ${isSupportExpanded ? styles.expanded : ''}`}>
            <Up/>
          </button>
        }
      </span>
      {
        hasSupport && 
        <SupportPathGroup 
          dataObj={supportDataObject} 
          isExpanded={isSupportExpanded}
        />
      }
    </>
  )
}

export default Predicate;