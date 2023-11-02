import styles from './PathObject.module.scss';
import Tooltip from '../Tooltip/Tooltip';
import Disease from '../../Icons/disease2.svg?react';
import ExternalLink from '../../Icons/external-link.svg?react';
import { capitalizeAllWords, formatBiolinkEntity, getIcon } from '../../Utilities/utilities';
import Highlighter from 'react-highlight-words';
import Predicate from './Predicate';

const PathObject = ({pathObject, id, handleNameClick, handleEdgeClick, handleTargetClick, activeStringFilters, selected, inModal = false}) => {

  let nameString = '';
  let typeString = '';
  if(pathObject.category !== 'predicate') {
    nameString = capitalizeAllWords(pathObject.name);
    typeString = formatBiolinkEntity(pathObject.type)
  }
  const provenance = (pathObject.provenance.length > 0) ? pathObject.provenance[0] : false;

  const uid = `${id}`;

  return (
    <>
      {
        pathObject.category === 'object' &&
        <span className={`${styles.nameContainer} ${inModal ? styles.inModal : ''}`} 
          onClick={(e)=> {e.stopPropagation(); handleNameClick(pathObject);}}
          data-tooltip-id={`${nameString}${uid}`}
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
            <Tooltip id={`${nameString}${uid}`}>
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
        <Predicate 
          pathObject={pathObject} 
          selected={selected} 
          activeStringFilters={activeStringFilters} 
          uid={uid}
          handleEdgeClick={handleEdgeClick}
          parentClass={styles.pathContainer}
          inModal={inModal}
        />
      }
      {
        pathObject.category === 'target' && 
        <span 
          className={styles.targetContainer} 
          data-tooltip-id={`${nameString}${uid}`}
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
          <Tooltip id={`${nameString}${uid}`}>
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