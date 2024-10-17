import styles from './PathObject.module.scss';
import { FC } from 'react';
import Tooltip from '../Tooltip/Tooltip';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import { formatBiolinkEntity, formatBiolinkNode, getIcon } from '../../Utilities/utilities';
import Highlighter from 'react-highlight-words';
import Predicate from './Predicate';
import { FormattedEdgeObject, FormattedNodeObject, PathObjectContainer, SupportDataObject, PathFilterState } from '../../Types/results';
import { isFormattedEdgeObject, isFormattedNodeObject } from '../../Utilities/utilities';

interface PathObjectProps {
  pathObject: FormattedEdgeObject | FormattedNodeObject;
  pathObjectContainer: PathObjectContainer;
  id: string;
  handleNameClick: (name: FormattedNodeObject) => void;
  handleEdgeClick: (edge: FormattedEdgeObject, path: PathObjectContainer) => void;
  handleTargetClick: (target: FormattedNodeObject) => void;
  hasSupport: boolean;
  activeEntityFilters: string[];
  selected?: boolean;
  supportDataObject: SupportDataObject | null;
  inModal?: boolean;
  isEven?: boolean;
  className?: string;
  pathFilterState: PathFilterState;
  pathViewStyles?: {[key: string]: string;} | null;
}

const PathObject: FC<PathObjectProps> = ({ pathObject, pathObjectContainer, id, handleNameClick, handleEdgeClick, handleTargetClick, hasSupport = false,
  activeEntityFilters, selected, pathFilterState, supportDataObject = null, inModal = false, isEven = false, className = "", pathViewStyles = null }) => {

  const provenance = (!!pathObject.provenance && pathObject.provenance.length > 0) ? pathObject.provenance[0] : false;
  const isNode = isFormattedNodeObject(pathObject);
  const type = (isNode && pathObject?.type) ? pathObject.type.replace("biolink:", ""): '';
  const uid = `${type}${id}`;
  let nameString = '';
  let typeString = '';
  if(isNode) {
    nameString = formatBiolinkNode(pathObject.name, type, pathObject.species);
    typeString = formatBiolinkEntity(pathObject.type)
  }

  return (
    <>
      {
        pathObject.category === 'object' && isNode &&
        <span className={`${styles.nameContainer} ${className} ${inModal ? styles.inModal : ''} ${isEven && styles.even}`}
          onClick={(e)=> {e.stopPropagation(); handleNameClick(pathObject);}}
          data-tooltip-id={`${nameString.replaceAll("'", "")}${uid}`}
          >
          <span className={`${!!pathViewStyles && pathViewStyles.nameInterior} ${styles.name}`} >
            {getIcon(pathObject.type)}
            <span className={styles.text}>
              <Highlighter
                highlightClassName="highlight"
                searchWords={activeEntityFilters}
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
          activeEntityFilters={activeEntityFilters}
          uid={uid}
          handleEdgeClick={handleEdgeClick}
          parentClass={styles.pathContainer}
          inModal={inModal}
          hasSupport={hasSupport}
          supportDataObject={supportDataObject}
          className={className}
          pathFilterState={pathFilterState}
          pathViewStyles={pathViewStyles}
        />
      }
      {
        pathObject.category === 'target' && isNode &&
        <span
          className={`${styles.targetContainer} ${className}`}
          data-tooltip-id={`${nameString.replaceAll("'", "")}${uid}`}
          onClick={(e)=> {e.stopPropagation(); handleTargetClick(pathObject);}}
          >
          <span className={`${!!pathViewStyles && pathViewStyles.targetInterior} ${styles.target}`}>
            {getIcon(pathObject.type)}
            <span className={styles.text}>
              <Highlighter
                highlightClassName="highlight"
                searchWords={activeEntityFilters}
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
