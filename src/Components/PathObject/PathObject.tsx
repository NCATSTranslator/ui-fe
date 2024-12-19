import styles from './PathObject.module.scss';
import { FC } from 'react';
import Tooltip from '../Tooltip/Tooltip';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import { formatBiolinkEntity, formatBiolinkNode, getIcon } from '../../Utilities/utilities';
import Highlighter from 'react-highlight-words';
import Predicate from './Predicate';
import { Path, PathFilterState, isResultNode, ResultNode, Filter } from '../../Types/results.d';
import { useSelector } from 'react-redux';
import { getResultSetById } from '../../Redux/resultsSlice';

interface PathObjectProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  className?: string;
  handleActivateEvidence?: (pathID: string) => void;
  handleEdgeClick: (edgeID: string, pathID: string) => void;
  handleNodeClick: (name: ResultNode) => void;
  id: string;
  index: number;
  inModal?: boolean;
  isEven?: boolean;
  pathID: string;
  pathFilterState: PathFilterState;
  pathViewStyles?: {[key: string]: string;} | null;
  pk: string;
  selected?: boolean;
  selectedPaths: Set<Path> | null;
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
  pathID, 
  pathViewStyles = null, 
  pk,
  selected, 
  selectedPaths }) => {

  const resultSet = useSelector(getResultSetById(pk));

  const pathObject = (index % 2 === 0) ? resultSet?.data.nodes[id] : resultSet?.data.edges[id];
  const isNode = isResultNode(pathObject);
  const type = isNode ? pathObject?.types[0].replace("biolink:", ""): '';
  const uid = `${pathID}-${index}-${id}`;
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
            <Predicate
              pathID={pathID}
              edge={pathObject}
              edgeID={id}
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
            />
      }
    </>
  )
}

export default PathObject;
