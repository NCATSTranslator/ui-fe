import styles from './PathObject.module.scss';
import { FC, useId } from 'react';
import Tooltip from '../Tooltip/Tooltip';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import { formatBiolinkEntity, formatBiolinkNode, getIcon } from '../../Utilities/utilities';
import Highlighter from 'react-highlight-words';
import Predicate from './Predicate';
import { Path, PathFilterState, isResultNode, ResultNode, Filter, isResultEdge } from '../../Types/results.d';
import { useSelector } from 'react-redux';
import { getEdgeById, getNodeById, getResultSetById } from '../../Redux/resultsSlice';

export interface PathObjectProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  className?: string;
  handleActivateEvidence?: (path: Path) => void;
  handleEdgeClick: (edgeIDs: string[], path: Path) => void;
  handleNodeClick: (name: ResultNode) => void;
  id: string | string[];
  index: number;
  inModal?: boolean;
  isEven?: boolean;
  path: Path;
  pathFilterState: PathFilterState;
  pathViewStyles?: {[key: string]: string;} | null;
  pk: string;
  selected?: boolean;
  selectedPaths: Set<Path> | null;
  showHiddenPaths?: boolean;
}

const PathObject: FC<PathObjectProps> = ({ 
  activeEntityFilters, 
  activeFilters,
  className = "", 
  handleActivateEvidence = ()=>{},
  handleNodeClick, 
  handleEdgeClick, 
  id, 
  index, 
  inModal = false, 
  isEven = false, 
  pathFilterState, 
  path, 
  pathViewStyles = null, 
  pk,
  selected, 
  selectedPaths,
  showHiddenPaths = true}) => {

  const resultSet = useSelector(getResultSetById(pk));

  // ID of the main element (in the case of a compressed edge)
  const itemID = (Array.isArray(id)) ? id[0] : id; 
  const pathObject = (index % 2 === 0) ? getNodeById(resultSet, itemID) : getEdgeById(resultSet, itemID);
  const isNode = isResultNode(pathObject);
  const isEdge = isResultEdge(pathObject);
  const type = isNode ? pathObject?.types[0].replace("biolink:", ""): '';
  const uid = useId();
  let nameString = '';
  let typeString = '';
  if(isNode) {
    nameString = formatBiolinkNode(pathObject.names[0], type, pathObject.species);
    typeString = formatBiolinkEntity(type);
  }

  const provenance = (!!pathObject?.provenance && pathObject.provenance.length > 0) ? pathObject.provenance[0] : false;
  const description = (isNode && !!pathObject?.descriptions[0]) ? pathObject.descriptions[0] : '';

  if(!pathObject)
    return null;

  return (
    <>
      {
        isNode 
          ?
            <span className={`${styles.nameContainer} ${className} ${inModal ? styles.inModal : ''} ${isEven && styles.even}`}
              onClick={(e)=> {e.stopPropagation(); handleNodeClick(pathObject);}}
              data-tooltip-id={`${uid}`}
              >
              <span className={`${!!pathViewStyles && pathViewStyles.nameInterior} ${styles.name}`} >
                {getIcon(pathObject?.types[0])}
                <span className={styles.text}>
                  <Highlighter
                    highlightClassName="highlight"
                    searchWords={activeEntityFilters}
                    autoEscape={true}
                    textToHighlight={nameString}
                  />
                </span>
              </span>
              <Tooltip id={`${uid}`}>
                <span><strong>{nameString}</strong> ({typeString})</span>
                <span className={styles.description}>{description}</span>
                {
                  provenance && typeof provenance === "string" &&
                  <a href={provenance} target="_blank" rel='noreferrer' className={styles.provenance}>
                    <ExternalLink/>
                    <span>{provenance}</span>
                  </a>
                }
              </Tooltip>
            </span>
          :
            isEdge 
              ?
                <Predicate
                  path={path}
                  edge={pathObject}
                  edgeIDs={(Array.isArray(id)) ? id : [id]}
                  selected={selected}
                  activeEntityFilters={activeEntityFilters}
                  activeFilters={activeFilters}
                  uid={uid}
                  handleActivateEvidence={handleActivateEvidence}
                  handleEdgeClick={handleEdgeClick}
                  handleNodeClick={handleNodeClick}
                  parentClass={styles.pathContainer}
                  inModal={inModal}
                  className={className}
                  pathFilterState={pathFilterState}
                  pathViewStyles={pathViewStyles}
                  selectedPaths={selectedPaths}
                  pk={pk}
                  showHiddenPaths={showHiddenPaths}
                />
              :
                null
      }
    </>
  )
}

export default PathObject;
