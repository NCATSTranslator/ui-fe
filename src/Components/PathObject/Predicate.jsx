import styles from './Predicate.module.scss';
import ResearchSingle from '../../Icons/research-single.svg?react';
import ResearchMultiple from '../../Icons/research-multiple.svg?react';
import Highlighter from 'react-highlight-words';
import { capitalizeAllWords } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';
import { cloneDeep } from 'lodash';

const Predicate = ({pathObject, selected, activeStringFilters, uid, parentClass = '', handleEdgeClick, inModal = false}) => {

  pathObject.predicate = pathObject.predicates[0]; 
  const pubCount = Object.values(pathObject.publications).reduce((sum, arr) => sum + arr.length, 0);
  return (
    <span 
      className={`${selected ? styles.selected : ''} ${parentClass}`} 
      onClick={(e)=> {e.stopPropagation(); handleEdgeClick(pathObject);}}
      >
      <span className={`connector ${styles.connector}`}></span>
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
    </span>
  )
}

export default Predicate;