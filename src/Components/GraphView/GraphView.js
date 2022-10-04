import styles from './GraphView.module.scss';
import React, {useState, useEffect} from "react";
import GraphPath from '../GraphPath/GraphPath';
import {ReactComponent as Question} from '../../Icons/Navigation/Question.svg';
import { useOutletContext } from 'react-router-dom';

const GraphView = ({paths, handleEdgeSpecificEvidence, activeStringFilters}) => {

  let initialNumberToShow = (paths.length < 6) ? paths.length : 6;
  const [numberToShow, setNumberToShow] = useState(initialNumberToShow);

  const setFeedbackModalOpen = useOutletContext();

  useEffect(() => {
    setNumberToShow((paths.length < 6) ? paths.length : 6);
  }, [paths]);

  // number of  hops
  let graphWidth = 3;
  // for (let index = 0; index < graph.length; index++) {
  //   if(graph[index].length > graphWidth)
  //   graphWidth = Math.floor(graph[index].length / 2); 
  // }

  const displayHeadings = (count) => {
    let headingMarkup = [];
    for (let index = 0; index < count; index++) {
      headingMarkup.push(<span key={`${index}_e`}>Entity</span>);
      headingMarkup.push(<span key={`${index}_r`}>Relationship</span>);
    }
    headingMarkup.push(<span key='i'>Target</span>);
    return headingMarkup;
  }

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
    let newAmount = (numberToShow + 6 > paths.length) ? paths.length : numberToShow + 6;
    setNumberToShow(newAmount);
  }

  const handleShowLess = () => {
    let newAmount = (numberToShow - 6 <= 6) ? numberToShow - (numberToShow - 6) : numberToShow - 6;
    setNumberToShow(newAmount);
  }

  return(
    <div className={styles.graphView}>
      <div className={styles.header}>
        <p className={styles.subtitle}>Paths</p>
        <p>Click on any entity to view a definition (if available), or click on any relationship to view evidence that supports it.</p>
      </div>
      <div className={styles.tableHead}>
        {displayHeadings(graphWidth)}
      </div>
      {
        paths.slice(0, numberToShow).map((pathToDisplay, i)=> {
          return (
            <div className={styles.tableItem} key={i}> 
              {
                pathToDisplay.map((pathItem, j) => {
                  let key = `${i}_${j}`;
                  return (
                    <GraphPath 
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
          (numberToShow < paths.length) &&
          <button onClick={(e)=> {e.stopPropagation(); handleShowMore();}} className={styles.show}>Show More</button>
        }
        {
          (numberToShow <= paths.length && numberToShow > 6) &&
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

export default GraphView;