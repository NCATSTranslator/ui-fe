import styles from './GraphPath.module.scss';
import React, {useState} from "react";
import Tooltip from '../Tooltip/Tooltip';
import { getIcon } from '../../Utilities/utilities';
import {ReactComponent as Disease} from '../../Icons/disease2.svg';
import {ReactComponent as ExternalLink} from '../../Icons/external-link.svg';
import {ReactComponent as Connector} from '../../Icons/connector-os.svg';
import {ReactComponent as Info} from '../../Icons/Alerts/Info.svg';
import { capitalizeAllWords, formatBiolinkEntity, getRandomIntInclusive } from '../../Utilities/utilities';
import { cloneDeep } from 'lodash';
import Highlighter from 'react-highlight-words';
import Modal from '../Modals/Modal';

const GraphPath = ({path, handleNameClick, handleEdgeClick, handleTargetClick, activeStringFilters}) => {

  let nameString = '';
  let typeString = '';
  if(path.category !== 'predicate') {
    nameString = capitalizeAllWords(path.name);
    typeString = formatBiolinkEntity(path.type)
  }

  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const randomIntForTooltip = getRandomIntInclusive(1,100000);

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
        path.category === 'object' &&
        <span className={styles.nameContainer} 
          onClick={(e)=> {e.stopPropagation(); handleNameClick(path);}}
          data-tooltip-id={`${nameString}${randomIntForTooltip}`}
          >
          <span className={styles.name} >
            {getIcon(path.type)}
            <span className={styles.text}>
              <Highlighter
                highlightClassName="highlight"
                searchWords={activeStringFilters}
                autoEscape={true}
                textToHighlight={nameString}
              />
            </span>
          </span>
            <Tooltip id={`${nameString}${randomIntForTooltip}`}>
              <span><strong>{nameString}</strong> ({typeString})</span>
              {path.description}
              {
                path.provenance && 
                <a href={path.provenance} target="_blank" rel='noreferrer' className={styles.provenance}>
                  <ExternalLink/>
                  <span>{path.provenance}</span>
                </a>
              }
            </Tooltip>
        </span>
      }
      {
        path.category === 'predicate' &&
        <span 
          className={styles.pathContainer} 
          data-tooltip-id={`${path.predicates[0]}${randomIntForTooltip}`}
          onClick={(e)=> {e.stopPropagation(); handleEdgeClick(path);}}
          >
          <Connector />
          <span className={`${styles.path} path ${(path.predicates.length > 1) ? styles.hasMore : ''}`}>
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeStringFilters}
              autoEscape={true}
              textToHighlight={capitalizeAllWords(path.predicates[0])}
            />
            {path.predicates.length > 1 && 
            <span className={styles.more}>
              + {path.predicates.length - 1} More
            </span>}
          </span>
          <Tooltip 
            id={`${path.predicates[0]}${randomIntForTooltip}`}
            > 
            {
              path.predicates.length > 1 &&
              <div className={styles.predicatesList}>{
                path.predicates.map((predicate, i)=> {

                  return (
                    <p 
                      key={i} 
                      className={styles.predicate} 
                      // Predicate click to get specific evidence will go here 
                      onClick={(e)=> {e.stopPropagation(); predicateSpecificEdgeClick(path, predicate)}}
                      >
                      <Highlighter
                        highlightClassName="highlight"
                        searchWords={activeStringFilters}
                        autoEscape={true}
                        textToHighlight={capitalizeAllWords(predicate)}
                      />
                    </p>
                  )
                })}
              </div>
            }
            {
              path.predicates.length <= 1 &&
              path.predicates.map((predicate, i)=> {
                return (
                  <p 
                    key={i} 
                    className={styles.predicate} 
                    // Predicate click to get specific evidence will go here 
                    onClick={(e)=> {e.stopPropagation(); predicateSpecificEdgeClick(path, predicate)}}
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
            {
              path.provenance.length > 0 && 
              <button onClick={(e)=>{ e.stopPropagation(); setSourceModalOpen(true);}} target="_blank" rel='noreferrer' className={styles.provenance}>
                <Info/>
                Source(s)
              </button>
            }
          </Tooltip>
        </span>
      }
      {
        path.category === 'target' && 
        <span 
          className={styles.targetContainer} 
          data-tooltip-id={`${nameString}${randomIntForTooltip}`}
          onClick={(e)=> {e.stopPropagation(); handleTargetClick(path);}}
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
          <Tooltip id={`${nameString}${randomIntForTooltip}`}>
            <span><strong>{nameString}</strong> ({typeString})</span>
            {path.description}
            {
              path.provenance && 
              <a href={path.provenance} target="_blank" rel='noreferrer' className={styles.provenance}>
                <ExternalLink/>
                <span>{path.provenance}</span>
              </a>
            }
          </Tooltip>
        </span>
      }
      {
        // Add sources modal for predicates
        path.category === 'predicate' && path.provenance.length > 0 && 
        <Modal isOpen={sourceModalOpen} onClose={()=> setSourceModalOpen(false)}>
          <div>
            <h5 className={styles.sourceHeading}>Sources:</h5>
            <div className='tableBody'>
              <div className='tableHead'>
                <div className='head'>Relationship</div>
                <div className='head'>Source</div>
                <div className='head'>Link</div>
              </div>
              <div className='tableItems'>
                {
                  path.edges.map((item, i) => { 
                    let subjectName = capitalizeAllWords(item.subject.names[0]);
                    let predicateName = capitalizeAllWords(item.predicate);
                    let objectName = capitalizeAllWords(item.object.names[0]);
                    return(
                      <div className='tableItem'>
                        <div className="tableCell">
                          <div className={styles.sourceEdgeContainer}>
                            <span className={styles.sourceEdge} key={i}>{subjectName}<strong>{predicateName}</strong>{objectName}</span>
                          </div>
                        </div>
                          {
                            item.provenance.map((provenance, j) => { 
                              let name = (!Array.isArray(provenance) && typeof provenance === 'object') ? provenance.name: '';
                              let url = (!Array.isArray(provenance) && typeof provenance === 'object') ? provenance.url: provenance;
                              return(
                                <>
                                  <div className='tableCell'>
                                    <span className={styles.sourceEdge} key={i}>{name}</span>
                                  </div>
                                  <div className='tableCell'>
                                    <a key={j} href={url} target="_blank" rel="noreferrer" className={styles.edgeProvenanceLink}>
                                      {url}
                                    </a>
                                  </div>
                                </>
                              )
                            })
                          }
                      </div>
                    )
                  })
                }
              </div>
            </div>
          </div>
        </Modal>
      }
    </>
  )
}

export default GraphPath;