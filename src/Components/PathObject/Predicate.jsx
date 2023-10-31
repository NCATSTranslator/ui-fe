import styles from './Predicate.module.scss';
import Connector from '../../Icons/connector-os.svg?react';
import ResearchSingle from '../../Icons/research-single.svg?react';
import ResearchMultiple from '../../Icons/research-multiple.svg?react';
import { predicateSpecificEdgeClick } from '../../Utilities/resultsInteractionFunctions';
import Highlighter from 'react-highlight-words';
import { capitalizeAllWords } from '../../Utilities/utilities';
import Tooltip from '../Tooltip/Tooltip';

const Predicate = ({pathObject, selected, activeStringFilters, uid, parentClass = '', handleEdgeClick, inModal = false}) => {

  pathObject.predicate = pathObject.predicates[0]; 
  return (
    <span 
      className={`${selected ? styles.selected : ''} ${parentClass}`} 
      data-tooltip-id={`${pathObject.predicate}${uid}`}
      onClick={(e)=> {e.stopPropagation(); handleEdgeClick(pathObject);}}
      >
      <Connector className={styles.connector} />
      <span className={`${styles.path} path ${(pathObject.predicates.length > 1) ? styles.hasMore : ''}`}>
        {
          pathObject.publications?.length > 1
          ? <ResearchMultiple />
          : (pathObject.publications?.length > 0 || pathObject.provenance?.length > 0) 
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
        !inModal &&
        <Tooltip 
          id={`${pathObject.predicate}${uid}`}
          > 
          {
            pathObject.predicates &&
            <div className={styles.predicatesList}>
              {
                pathObject.predicates.map((predicate, i)=> {
                  return (
                    <p 
                      key={`${pathObject.predicate}${uid}${i}`} 
                      className={styles.predicate} 
                      // Predicate click to get specific evidence will go here 
                      onClick={(e)=> {e.stopPropagation(); predicateSpecificEdgeClick(pathObject, predicate)}}
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