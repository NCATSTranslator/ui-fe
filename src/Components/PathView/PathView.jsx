import styles from './PathView.module.scss';
import {useState, useEffect, useMemo} from "react";
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
  if(selectedPaths.size > 0) {
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

  const handleNameClick = (name) => {
    console.log("handle name click");
  }

  const handleEdgeClick = (edgeGroup, path) => {
    handleEdgeSpecificEvidence(edgeGroup, path);
  }

  const handleTargetClick = (target) => {
    console.log("handle target click");
  }

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
      <Tooltip id='direct-label-tooltip'>
        <span className={styles.inferredLabelTooltip}>These paths are supported by existing evidence, click on one of the relationships to view available evidence.</span>
      </Tooltip>
      <Tooltip id='inferred-label-tooltip'>
        <span className={styles.inferredLabelTooltip}>These paths are supported by the other asserted path(s) listed below, rather than purely by existing evidence.</span>
      </Tooltip>
      <div className={styles.header}>
        <p className={styles.subtitle}>Paths</p>
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
              const tooltipID = pathToDisplay.path.subgraph.map((sub, j) => (j % 2 === 0) ? sub.name : sub.predicates[0] );
              return (
                <>
                  {
                    displayDirectLabel 
                      ? 
                        <p className={styles.inferenceLabel} data-tooltip-id="direct-label-tooltip">
                          Asserted <Information className={styles.infoIcon} />
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
                            Predicted <Information className={styles.infoIcon} />
                          </p>
                        </>
                      : null
                    }
                  <div className={styles.formattedPath}>
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
                    <div 
                      className={`${styles.tableItem} ${selectedPaths.size > 0 && !pathToDisplay.highlighted ? styles.unhighlighted : ''}`} 
                      key={i}
                      > 
                      {
                        pathToDisplay.path.subgraph.map((pathItem, j) => {
                          let key = `${i}_${j}`;
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