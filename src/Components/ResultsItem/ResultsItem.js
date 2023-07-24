import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import styles from './ResultsItem.module.scss';
import { getIcon, capitalizeAllWords } from '../../Utilities/utilities';
import PathView from '../PathView/PathView';
import LoadingBar from '../LoadingBar/LoadingBar';
import {ReactComponent as ChevDown } from "../../Icons/Directional/Property 1 Down.svg"
import {ReactComponent as Export } from "../../Icons/Buttons/Export.svg"
import AnimateHeight from "react-animate-height";
import Highlighter from 'react-highlight-words';
import { cloneDeep } from 'lodash';
import { CSVLink } from 'react-csv';
import { generateCsvFromItem } from '../../Utilities/csvGeneration';

const GraphView = lazy(() => import("../GraphView/GraphView"));

const ResultsItem = ({key, item, type, activateEvidence, activeStringFilters, rawResults, zoomKeyDown}) => {

  let icon = getIcon(item.type);

  let publicationCount = item.evidence.publications.length;
  let sourcesCount = item.evidence.distinctSources.length;

  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const formattedPaths = item.compressedPaths;
  const [selectedPaths, setSelectedPaths] = useState(new Set());
  const [csvData, setCsvData] = useState([]);

  const initPathString = useRef((type?.pathString) ? type.pathString : 'may affect');

  const pathString = (formattedPaths.length > 1) ? `Paths that ${initPathString.current}` : `Path that ${initPathString.current}`;
  const nameString = (item.name !== null) ? item.name : '';
  const objectString = (item.object !== null) ? capitalizeAllWords(item.object) : '';

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  const handleEdgeSpecificEvidence = (edgeGroup) => {
    const filterEvidenceObjs = (objs, selectedEdge, container) => {
      for (const obj of objs) {
        if (obj.edges[selectedEdge.id] !== undefined) {
          const includedObj = cloneDeep(obj);
          includedObj.edges = {};
          includedObj.edges[selectedEdge.id] = obj.edges[selectedEdge.id];
          container.push(includedObj);
        }
      }
    }

    let filteredEvidence = {
      publications: [],
      sources: []
    };

    let filteredPublications = filteredEvidence.publications;
    let filteredSources = filteredEvidence.sources;
    for (const edge of edgeGroup.edges) {
      filterEvidenceObjs(item.evidence.publications, edge, filteredPublications);
      filterEvidenceObjs(item.evidence.sources, edge, filteredSources);
    }

    // call activateEvidence with the filtered evidence
    activateEvidence(filteredEvidence, item, edgeGroup, false);
  }

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  const handleClearSelectedPaths = useCallback(() => {
    setSelectedPaths(new Set())
  },[]);

  const handleNodeClick = useCallback((selectedPaths) => {
    if(!selectedPaths) 
      return;

    let newSelectedPaths = new Set();

    for(const path of formattedPaths) {
      if(path.path.subgraph.length === 3) {
        newSelectedPaths.add(path);
      }
    }

    for(const selPath of selectedPaths) {
      for(const path of formattedPaths) {
        let currentNodeIndex = 0;
        let numMatches = 0;
        for(const [i, el] of path.path.subgraph.entries()) {
          if(i % 2 !== 0)
            continue;

          if(selPath[currentNodeIndex] && el.curies.includes(selPath[currentNodeIndex])) {
            numMatches++;
          }
          currentNodeIndex++;
        }
        if(numMatches === selPath.length) {
          newSelectedPaths.add(path);
          break;
        }
      }
    }

    setSelectedPaths(newSelectedPaths)

  },[formattedPaths]);

  return (
    <div key={key} className={`${styles.result} result`} data-resultcurie={JSON.stringify(item.subjectNode.curies.slice(0, 5))}>
      <div className={`${styles.nameContainer} ${styles.resultSub}`} onClick={handleToggle}>
        <span className={styles.icon}>{icon}</span>
        {
          item.highlightedName &&
          <span className={styles.name} dangerouslySetInnerHTML={{__html: item.highlightedName}} ></span>
        }
        {
          !item.highlightedName &&
          <span className={styles.name} >
            <Highlighter
              highlightClassName="highlight"
              searchWords={activeStringFilters}
              autoEscape={true}
              textToHighlight={nameString}
            />
          </span>
        }
        <span className={styles.effect}>{formattedPaths.length} {pathString} {objectString}</span>
      </div>
      <div className={`${styles.evidenceContainer} ${styles.resultSub}`}>
        <span
          className={styles.evidenceLink}
          onClick={(e)=>{
            e.stopPropagation();
            activateEvidence(item.evidence, item, [], true);
          }}
          >
          <div>
            <span className={styles.viewAll}>View All Evidence</span>
          </div>
          <div>
            <span className={styles.info}>Publications ({publicationCount})</span>
            <span className={styles.info}>Sources ({sourcesCount})</span>
          </div>
        </span>
      </div>
      <div className={`${styles.scoreContainer} ${styles.resultSub}`}>
        <span className={styles.score}>
          <span className={styles.scoreNum}>{item.score === null ? '0' : item.score }</span>
        </span>
      </div>
      <CSVLink
        className={styles.downloadButton}
        data={csvData}
        filename={`${item.name.toLowerCase()}.csv`}
        onClick={generateCsvFromItem(item, setCsvData)}>
          <Export/>
      </CSVLink>
      <button className={`${styles.accordionButton} ${isExpanded ? styles.open : styles.closed }`} onClick={handleToggle}>
        <ChevDown/>
      </button>
      <AnimateHeight
        className={`${styles.accordionPanel} ${isExpanded ? styles.open : styles.closed } ${item.description ? styles.hasDescription : styles.noDescription }`}
        duration={500}
        height={height}
        >
        <div className={styles.container}>
          {
            item.description &&
            <p>
              <Highlighter
                highlightClassName="highlight"
                searchWords={activeStringFilters}
                autoEscape={true}
                textToHighlight={item.description}
              />
            </p>
          }
        </div>
        <Suspense fallback={<LoadingBar loading useIcon reducedPadding />}>
          <GraphView
            result={item}
            rawResults={rawResults}
            onNodeClick={handleNodeClick}
            clearSelectedPaths={handleClearSelectedPaths}
            active={isExpanded}
            zoomKeyDown={zoomKeyDown}
          />
        </Suspense>
        <PathView
          paths={formattedPaths}
          selectedPaths={selectedPaths}
          active={isExpanded}
          handleEdgeSpecificEvidence={(edgeGroup)=> {handleEdgeSpecificEvidence(edgeGroup)}}
          activeStringFilters={activeStringFilters}
        />
      </AnimateHeight>
    </div>
  );
}

export default ResultsItem;
