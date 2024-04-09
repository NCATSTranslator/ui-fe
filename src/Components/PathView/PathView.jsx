import styles from './PathView.module.scss';
import {useState, useEffect, useMemo, useCallback} from "react";
import PathObject from '../PathObject/PathObject';
import Tooltip from '../Tooltip/Tooltip';
import Question from '../../Icons/Navigation/Question.svg?react';
import Information from '../../Icons/information.svg?react';
import ResearchMultiple from '../../Icons/research-multiple.svg?react';
import { cloneDeep, isEqual } from 'lodash';
import { useSelector } from 'react-redux';
import { currentPrefs, currentRoot } from '../../Redux/rootSlice';
import { Link } from 'react-router-dom';
import { getGeneratedSendFeedbackLink } from '../../Utilities/utilities';
import { hasSupport } from '../../Utilities/resultsFormattingFunctions';

const checkInferredPathForSelections = (path, selPath) => {
  for(const [i, item] of path.path.subgraph.entries()) {
    if(i % 2 === 0)
      continue;
    if(hasSupport(item)) {
      for(const supportPath of item.support) {
        if(isEqual(selPath, supportPath)) {
          supportPath.highlighted = true;
        }
      }
    }
  }
}

const getPathsWithSelectionsSet = (paths, selectedPaths) => {
  if(selectedPaths!== null && selectedPaths.size > 0) {
    let newPaths = cloneDeep(paths);
    for(const path of newPaths) {
      for(const selPath of selectedPaths) {
        if(isEqual(selPath, path)) {
          path.highlighted = true;
        }
        if(path.path.inferred) {
          checkInferredPathForSelections(path, selPath);
        }
      }
    }
    return Array.from(newPaths).sort((a, b) => b.highlighted - a.highlighted);
  } else {
    return Array.from(paths);
  }
}

const PathView = ({active, paths, selectedPaths, handleEdgeSpecificEvidence, handleActivateEvidence, activeStringFilters}) => {

  const prefs = useSelector(currentPrefs);

  const initItemsPerPage = (prefs?.path_show_count?.pref_value) ? parseInt(prefs.path_show_count.pref_value) : parseInt(5);
  let initialNumberToShow = (initItemsPerPage === -1 || paths.length < initItemsPerPage) ? paths.length : initItemsPerPage;

  const [numberToShow, setNumberToShow] = useState(initialNumberToShow);
  const formattedPaths = useMemo(() => getPathsWithSelectionsSet(paths, selectedPaths), [paths, selectedPaths]);

  let directLabelDisplayed = false;
  let inferredLabelDisplayed = false;

  const root = useSelector(currentRoot);

  // update defaults when prefs change, including when they're loaded from the db since the call for new prefs  
  // comes asynchronously in useEffect (which is at the end of the render cycle) in App.js 
  useEffect(() => {
    const tempItemsPerPage = (prefs?.path_show_count?.pref_value) ? parseInt(prefs.path_show_count.pref_value) : 5;
    const tempNumberToShow = (tempItemsPerPage === -1 || paths.length < tempItemsPerPage) ? paths.length : tempItemsPerPage;
    setNumberToShow(tempNumberToShow);
  }, [prefs, paths]);

  useEffect(() => {
    let temp = initItemsPerPage;
    if(parseInt(initItemsPerPage) === -1 || paths.length < initItemsPerPage)
      temp = paths.length;

    setNumberToShow(temp);
  }, [paths, initItemsPerPage]);

  const handleNameClick = useCallback((name) => {
    console.log("handle name click", name);
    if(Array.isArray(name.provenance) && name.provenance[0].length > 0 && name.provenance[0].includes("http"))
      window.open(name.provenance[0], '_blank');
  },[]);

  const handleEdgeClick = useCallback((edgeGroup, path) => {
    handleEdgeSpecificEvidence(edgeGroup, path);
  }, [handleEdgeSpecificEvidence]);

  const handleTargetClick = useCallback((target) => {
    console.log("handle target click", target);
    if(Array.isArray(target.provenance) && target.provenance[0].length > 0 && target.provenance[0].includes("http"))
      window.open(target.provenance[0], '_blank');
  },[]);

  const handleShowMore = () => {
    let newAmount = (numberToShow + initItemsPerPage > paths.length) ? paths.length : numberToShow + initItemsPerPage;
    setNumberToShow(newAmount);
  }

  const handleShowLess = () => {
    let newAmount = (numberToShow - initItemsPerPage <= initItemsPerPage) ? numberToShow - (numberToShow - initItemsPerPage) : numberToShow - initItemsPerPage;
    setNumberToShow(newAmount);
  }

  const sortArrayByInferred = (array) => {
    return array.sort((a, b) => {
        let inferredA = a.path.inferred ? 1 : 0;
        let inferredB = b.path.inferred ? 1 : 0;
        return inferredA - inferredB;
    });
  }


  return(
    <div className={styles.pathView}>
      <Tooltip id='paths-label-tooltip'>
        <span className={styles.inferredLabelTooltip}>Paths are composed of stepwise links for each result's key concepts. Select a path to explore publications and additional resources supporting each relationship.</span>
      </Tooltip>
      <Tooltip id='direct-label-tooltip'>
        <span className={styles.inferredLabelTooltip}>Established from explicit evidence in external sources. Example: A research paper stating 'X is related to Y.'</span>
      </Tooltip>
      <Tooltip id='inferred-label-tooltip'>
        <span className={styles.inferredLabelTooltip}>Deduced from patterns in Translator's knowledge graphs that suggest relationships which are not explicitly stated. The paths shown below them support the inferred relationship.</span>
      </Tooltip>
      <div className={styles.header}>
        <p className={styles.subtitle}>Paths<Information data-tooltip-id='paths-label-tooltip'/></p>
        <p>Hover over any entity to view a definition (if available), or click on any relationship to view evidence that supports it.</p>
      </div>
      {
        (!active) 
        ? <></>
        :
        <div className={styles.paths}>
          {
            sortArrayByInferred(formattedPaths).slice(0, numberToShow).map((pathToDisplay, i)=> {
              const displayInferredLabel = pathToDisplay.path.inferred && !inferredLabelDisplayed;
                if(displayInferredLabel)
                  inferredLabelDisplayed = true;
              const displayDirectLabel = !pathToDisplay.path.inferred && !directLabelDisplayed;
                if(displayDirectLabel)
                  directLabelDisplayed = true;
              const tooltipID = pathToDisplay.id 
                ? pathToDisplay.id 
                : pathToDisplay.path.subgraph.map((sub, j) => (j % 2 === 0) ? sub.name : sub.predicates[0].predicate );
              return (
                <>
                  {
                    displayDirectLabel 
                      ? 
                        <p className={styles.inferenceLabel} data-tooltip-id="direct-label-tooltip">
                          Lookup <Information className={styles.infoIcon} />
                        </p>
                      : 
                        null
                  }
                  {
                    displayInferredLabel 
                      ? 
                        <>
                          { directLabelDisplayed ? <div className={styles.inferenceSeparator}></div> : null }
                          <p className={styles.inferenceLabel} data-tooltip-id="inferred-label-tooltip" >
                            Inferred <Information className={styles.infoIcon} />
                          </p>
                        </>
                      : null
                    }
                  <div className={styles.formattedPath} key={tooltipID}>
                    <button 
                      onClick={()=>handleActivateEvidence(pathToDisplay)}
                      className={styles.pathEvidenceButton}
                      data-tooltip-id={tooltipID}
                      >
                        <ResearchMultiple />
                    </button>
                    <Tooltip 
                      id={tooltipID}
                      >
                        <span>View evidence for this path.</span>
                    </Tooltip>
                    <div className={`${styles.tableItem} ${selectedPaths !== null && selectedPaths.size > 0 && !pathToDisplay.highlighted ? styles.unhighlighted : ''}`} > 
                      {
                        pathToDisplay.path.subgraph.map((pathItem, j) => {
                          let key = `${pathItem.id ? pathItem.id : i}_${i}_${j}`;
                          let pathItemHasSupport = pathItem.inferred;
                          let supportDataObject = (pathItemHasSupport)
                            ? {
                                key: key,
                                pathItem: pathItem,
                                pathViewStyles: styles,
                                selectedPaths: selectedPaths, 
                                pathToDisplay: pathToDisplay, 
                                handleActivateEvidence: handleActivateEvidence, 
                                handleNameClick: handleNameClick, 
                                handleEdgeClick: handleEdgeClick, 
                                handleTargetClick: handleTargetClick, 
                                activeStringFilters: activeStringFilters
                              }
                            : null;
                          return (
                            <>
                              <PathObject 
                                supportDataObject={supportDataObject}
                                pathObject={pathItem} 
                                id={key}
                                key={key}
                                handleNameClick={handleNameClick}
                                handleEdgeClick={(edge)=>handleEdgeClick(edge, pathToDisplay)}
                                handleTargetClick={handleTargetClick}
                                activeStringFilters={activeStringFilters}
                                hasSupport={pathItemHasSupport}
                              />
                            </>
                          ) 
                        }) 
                      }
                    </div>
                  </div>
                </>
              )
            })
          }
        </div>
      }
      <div className={styles.buttons}>
        {
          (numberToShow < paths.length) &&
          <button onClick={(e)=> {e.stopPropagation(); handleShowMore();}} className={styles.show}>Show More</button>
        }
        {
          (numberToShow <= paths.length && numberToShow > initItemsPerPage && parseInt(initItemsPerPage) !== -1) &&
          <button onClick={(e)=> {e.stopPropagation(); handleShowLess();}} className={styles.show}>Show Less</button>
        }
      </div>
      {
        (numberToShow < paths.length) &&
        <button onClick={(e)=> {e.stopPropagation(); setNumberToShow(paths.length);}} className={`${styles.show} ${styles.showAll}`}>Show All</button>
      }
      <p className={styles.needHelp}>
        <Question/> 
        Was this helpful?
        <Link to={`${getGeneratedSendFeedbackLink(true, root)}`} reloadDocument target={'_blank'}>Send Feedback</Link>
      </p>
    </div>
  )
}

export default PathView;