import styles from './PathObject.module.scss';
import { FC } from 'react';
import Tooltip from '../Tooltip/Tooltip';
import ExternalLink from '../../Icons/external-link.svg?react';
import { formatBiolinkEntity, formatBiolinkNode, getIcon } from '../../Utilities/utilities';
import Highlighter from 'react-highlight-words';
import Predicate from './Predicate';
import { FormattedEdgeObject, FormattedNodeObject, PathObjectContainer, SupportDataObject } from '../../Types/results';
import { isFormattedEdgeObject, isFormattedNodeObject } from '../../Utilities/utilities';

interface PathObjectProps {
  pathObject: FormattedEdgeObject | FormattedNodeObject;
  pathObjectContainer: PathObjectContainer;
  id: string;
  handleNameClick: (name: FormattedNodeObject) => void;
  handleEdgeClick: (edge: FormattedEdgeObject, path: PathObjectContainer) => void;
  handleTargetClick: (target: FormattedNodeObject) => void;
  hasSupport: boolean;
  activeStringFilters: string[];
  selected?: boolean;
  supportDataObject: SupportDataObject | null;
  inModal?: boolean;
  isTop?: boolean;
  isBottom?: boolean;
  className?: string;
}

const PathObject: FC<PathObjectProps> = ({ pathObject, pathObjectContainer, id, handleNameClick, handleEdgeClick, handleTargetClick, hasSupport = false, 
  activeStringFilters, selected, supportDataObject = null, inModal = false, isTop = null, isBottom = null, className = "" }) => {

  const provenance = (!!pathObject.provenance && pathObject.provenance.length > 0) ? pathObject.provenance[0] : false;
  const isNode = isFormattedNodeObject(pathObject);
  const type = (isNode && pathObject?.type) ? pathObject.type.replace("biolink:", ""): '';
  const uid = `${type}${id}`;
  let nameString = '';
  let typeString = '';
  if(isNode) {
    nameString = formatBiolinkNode(pathObject.name, type);
    typeString = formatBiolinkEntity(pathObject.type)
  }

  return (
    <>
      {
        pathObject.category === 'object' && isNode &&
        <span className={`${styles.nameContainer} ${className} ${inModal ? styles.inModal : ''}`} 
          onClick={(e)=> {e.stopPropagation(); handleNameClick(pathObject);}}
          data-tooltip-id={`${nameString.replaceAll("'", "")}${uid}`}
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
            <Tooltip id={`${nameString.replaceAll("'", "")}${uid}`}>
              <span><strong>{nameString}</strong> ({typeString})</span>
              <span className={styles.description}>{pathObject.description}</span>
              {
                provenance && typeof provenance === "string" &&
                <a href={provenance} target="_blank" rel='noreferrer' className={styles.provenance}>
                  <ExternalLink/>
                  <span>{provenance}</span>
                </a>
              }
            </Tooltip>
        </span>
      }
      {
        pathObject.category === 'predicate' && isFormattedEdgeObject(pathObject) &&
        <Predicate 
          pathObject={pathObject}
          pathObjectContainer={pathObjectContainer}
          selected={selected} 
          activeStringFilters={activeStringFilters} 
          uid={uid}
          handleEdgeClick={handleEdgeClick}
          parentClass={styles.pathContainer}
          inModal={inModal}
          hasSupport={hasSupport}
          supportDataObject={supportDataObject}
          isTop={isTop}
          isBottom={isBottom}
          className={className}
        />
      }
      {
        pathObject.category === 'target' && isNode &&
        <span 
          className={`${styles.targetContainer} ${className}`} 
          data-tooltip-id={`${nameString.replaceAll("'", "")}${uid}`}
          onClick={(e)=> {e.stopPropagation(); handleTargetClick(pathObject);}}
          >
          <span className={styles.target} >
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
          <Tooltip id={`${nameString.replaceAll("'", "")}${uid}`}>
            <span><strong>{nameString}</strong> ({typeString})</span>
            <span className={styles.description}>{pathObject.description}</span>
            {
              provenance && typeof provenance === "string" &&
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