import styles from './PathView.module.scss';
import {useState, useEffect, useMemo} from "react";
import PathObject from '../PathObject/PathObject';
import Question from '../../Icons/Navigation/Question.svg?react';
import { cloneDeep, isEqual } from 'lodash';
import { useSelector } from 'react-redux';
import { currentPrefs, currentRoot } from '../../Redux/rootSlice';
import { Link } from 'react-router-dom';

const getPathsWithSelectionsSet = (paths, selectedPaths) => {
  if(selectedPaths.size > 0) {
    let newPaths = cloneDeep(paths);
    for(const path of newPaths) {
      for(const selPath of selectedPaths) {
        if(isEqual(selPath, path)) {
          path.highlighted = true;
          break;
        }
      }
    }
    return Array.from(newPaths).sort((a, b) => b.highlighted - a.highlighted);
  } else {
    return Array.from(paths);
  }
}

const PathView = ({active, paths, selectedPaths, handleEdgeSpecificEvidence, activeStringFilters}) => {

  const prefs = useSelector(currentPrefs);

  const initItemsPerPage = (prefs?.path_show_count?.pref_value) ? parseInt(prefs.path_show_count.pref_value) : parseInt(5);
  let initialNumberToShow = (initItemsPerPage === -1 || paths.length < initItemsPerPage) ? paths.length : initItemsPerPage;

  const [numberToShow, setNumberToShow] = useState(initialNumberToShow);
  const formattedPaths = useMemo(() => getPathsWithSelectionsSet(paths, selectedPaths), [paths, selectedPaths]);

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

  const handleEdgeClick = (edgeGroup) => {
    handleEdgeSpecificEvidence(edgeGroup)
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

  return(
    <div className={styles.pathView}>
      <div className={styles.header}>
        <p className={styles.subtitle}>Paths</p>
        <p>Click on any entity to view a definition (if available), or click on any relationship to view evidence that supports it.</p>
      </div>
      {
        (!active) 
        ? <></>
        :
          formattedPaths.slice(0, numberToShow).map((pathToDisplay, i)=> {
            return (
              <div 
                className={`${styles.tableItem} ${selectedPaths.size > 0 && !pathToDisplay.highlighted ? styles.unhighlighted : ''}`} 
                key={i}
                > 
                {
                  pathToDisplay.path.subgraph.map((pathItem, j) => {
                    let key = `${i}_${j}`;
                    return (
                      <PathObject 
                        pathObject={pathItem} 
                        id={key}
                        key={key}
                        handleNameClick={handleNameClick}
                        handleEdgeClick={(edge)=>handleEdgeClick(edge)}
                        handleTargetClick={handleTargetClick}
                        activeStringFilters={activeStringFilters}
                      />
                    ) 
                  }) 
                }
              </div>
            )
          })
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
        <Link to={`/${root}?fm=true`} reloadDocument target={'_blank'}>Send Feedback</Link>
      </p>
    </div>
  )
}

export default PathView;