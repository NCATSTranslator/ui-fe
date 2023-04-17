import styles from './PathView.module.scss';
import React, {useState, useEffect, useMemo} from "react";
import Path from '../Path/Path';
import {ReactComponent as Question} from '../../Icons/Navigation/Question.svg';
import { useOutletContext } from 'react-router-dom';
import { cloneDeep } from 'lodash';

const getFilteredUnhighlightedPaths = (paths, selectedPaths) => {
  if(selectedPaths.size > 0) {
    let newPaths = cloneDeep(paths);
    for(const path of newPaths) {
      for(const selPath of selectedPaths) {
        if(JSON.stringify(selPath) === JSON.stringify(path)) {
          path.highlighted = true;
          break;
        }
      }
    }
    return newPaths;
  } else {
    return paths;
  }
}

const PathView = ({paths, selectedPaths, handleEdgeSpecificEvidence, activeStringFilters}) => {

  let initialNumberToShow = (paths.size < 6) ? paths.size : 6;
  const [numberToShow, setNumberToShow] = useState(initialNumberToShow);
  const unhighlightedPaths = useMemo(() => getFilteredUnhighlightedPaths(paths, selectedPaths), [paths, selectedPaths]);

  const setFeedbackModalOpen = useOutletContext();

  useEffect(() => {
    setNumberToShow((paths.size < 6) ? paths.size : 6);
  }, [paths]);

  const handleNameClick = (name) => {
    console.log("handle name click");
  }

  const handleEdgeClick = (edge) => {
    handleEdgeSpecificEvidence(edge)
  }

  const handleTargetClick = (target) => {
    console.log("handle target click");
  }

  const handleShowMore = () => {
    let newAmount = (numberToShow + 6 > paths.size) ? paths.size : numberToShow + 6;
    setNumberToShow(newAmount);
  }

  const handleShowLess = () => {
    let newAmount = (numberToShow - 6 <= 6) ? numberToShow - (numberToShow - 6) : numberToShow - 6;
    setNumberToShow(newAmount);
  }

  return(
    <div className={styles.pathView}>
      <div className={styles.header}>
        <p className={styles.subtitle}>Paths</p>
        <p>Click on any entity to view a definition (if available), or click on any relationship to view evidence that supports it.</p>
      </div>
      {
        Array.from(unhighlightedPaths).sort((a, b) => b.highlighted - a.highlighted).slice(0, numberToShow).map((pathToDisplay, i)=> {
          return (
            <div className={`${styles.tableItem} ${selectedPaths.size > 0 && !pathToDisplay.highlighted ? styles.unhighlighted : ''}`} key={i}> 
              {
                pathToDisplay.path.map((pathItem, j) => {
                  let key = `${i}_${j}`;
                  return (
                    <Path 
                    path={pathItem} 
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
          (numberToShow < paths.size) &&
          <button onClick={(e)=> {e.stopPropagation(); handleShowMore();}} className={styles.show}>Show More</button>
        }
        {
          (numberToShow <= paths.size && numberToShow > 6) &&
          <button onClick={(e)=> {e.stopPropagation(); handleShowLess();}} className={styles.show}>Show Less</button>
        }
      </div>
      <p className={styles.needHelp}>
        <Question/> 
        Was this helpful?
        <button onClick={()=>{setFeedbackModalOpen(true)}} rel="noreferrer " target="_blank">Send Feedback</button>
      </p>
    </div>
  )
}

export default PathView;