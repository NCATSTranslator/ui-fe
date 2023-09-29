import styles from './PathObject.module.scss';
import Tooltip from '../Tooltip/Tooltip';
import { getIcon } from '../../Utilities/utilities';
import Disease from '../../Icons/disease2.svg?react';
import ExternalLink from '../../Icons/external-link.svg?react';
import Connector from '../../Icons/connector-os.svg?react';
import ResearchSingle from '../../Icons/research-single.svg?react';
import ResearchMultiple from '../../Icons/research-multiple.svg?react';
import { capitalizeAllWords, formatBiolinkEntity } from '../../Utilities/utilities';
import { cloneDeep } from 'lodash';
import Highlighter from 'react-highlight-words';
import { v4 as uuidv4 } from 'uuid';

const PathObject = ({pathObject, handleNameClick, handleEdgeClick, handleTargetClick, activeStringFilters}) => {

  let nameString = '';
  let typeString = '';
  if(pathObject.category !== 'predicate') {
    nameString = capitalizeAllWords(pathObject.name);
    typeString = formatBiolinkEntity(pathObject.type)
  }
  const provenance = (pathObject.provenance.length > 0) ? pathObject.provenance[0] : false;

  const uuid = uuidv4();

  // filter path by a provided predicate, then call handleEdgeClick with the filtered path object
  const predicateSpecificEdgeClick = (path, predicate) => {
    let filteredPath = cloneDeep(path);
    for(const edge of path.edges) {
      if(edge.predicate === predicate) {
        // filter out the non-matching edges and predicates
        filteredPath.edges = filteredPath.edges.filter(edge => edge.predicate === predicate);
        filteredPath.predicates = filteredPath.predicates.filter(pred => pred === predicate);
      }
    }
    // call the edge click handler with the newly filtered path
    handleEdgeClick(filteredPath);
  }

  return (
    <>
      {
        pathObject.category === 'object' &&
        <span className={styles.nameContainer} 
          onClick={(e)=> {e.stopPropagation(); handleNameClick(pathObject);}}
          data-tooltip-id={`${nameString}${uuid}`}
          >
          <span className={styles.name} >
            {getIcon(pathObject.type)}
            <span className={styles.text}>
              <Highlighter
                highlightClassName="highlight"
                searchWords={activeStringFilters}
                autoEscape={true}
                textToHighlight={nameString}
              />
            </span>
          </span>
            <Tooltip id={`${nameString}${uuid}`}>
              <span><strong>{nameString}</strong> ({typeString})</span>
              <span className={styles.description}>{pathObject.description}</span>
              {
                provenance && 
                <a href={provenance} target="_blank" rel='noreferrer' className={styles.provenance}>
                  <ExternalLink/>
                  <span>{provenance}</span>
                </a>
              }
            </Tooltip>
        </span>
      }
      {
        pathObject.category === 'predicate' &&
        <span 
          className={styles.pathContainer} 
          data-tooltip-id={`${pathObject.predicates[0]}${uuid}`}
          onClick={(e)=> {e.stopPropagation(); handleEdgeClick(pathObject);}}
          >
          <Connector />
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
                textToHighlight={capitalizeAllWords(pathObject.predicates[0])}
              />
              {
                pathObject.predicates.length > 1 && 
                <span className={styles.more}>
                  + {pathObject.predicates.length - 1} More
                </span>
              }
            </span>
          </span>
          <Tooltip 
            id={`${pathObject.predicates[0]}${uuid}`}
            > 
            {
              pathObject.predicates &&
              <div className={styles.predicatesList}>
                {
                  pathObject.predicates.map((predicate, i)=> {
                    return (
                      <p 
                        key={`${pathObject.predicates[0]}${uuid}${i}`} 
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
        </span>
      }
      {
        pathObject.category === 'target' && 
        <span 
          className={styles.targetContainer} 
          data-tooltip-id={`${nameString}${uuid}`}
          onClick={(e)=> {e.stopPropagation(); handleTargetClick(pathObject);}}
          >
          <span className={styles.target} >
            <Disease/>
            <span className={styles.text}>
              <Highlighter
                highlightClassName="highlight"
                searchWords={activeStringFilters}
                autoEscape={true}
                textToHighlight={nameString}
              />
            </span>
          </span>
          <Tooltip id={`${nameString}${uuid}`}>
            <span><strong>{nameString}</strong> ({typeString})</span>
            <span className={styles.description}>{pathObject.description}</span>
            {
              provenance && 
              <a href={provenance} target="_blank" rel='noreferrer' className={styles.provenance}>
                <ExternalLink/>
                <span>{provenance}</span>
              </a>
            }
          </Tooltip>
        </span>
      }
    </>
  )
}

export default PathObject;