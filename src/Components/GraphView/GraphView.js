import styles from './GraphView.module.scss';
import React, {useState, useEffect} from "react";
import GraphPath from '../GraphPath/GraphPath';
import { formatBiolinkPredicate } from '../../Utilities/utilities';
import { cloneDeep } from 'lodash';

const GraphView = ({paths}) => {

  const [rawGraph, setRawGraph] = useState([])
  const [compressedGraph, setCompressedGraph] = useState([])
  const [numberOfCompressedElements, setNumberOfCompressedElements] = useState(0); 
  let initialNumberToShow = (paths.length < 6) ? paths.length : 6;
  const [numberToShow, setNumberToShow] = useState(initialNumberToShow);

  useEffect(() => {
    let newGraph = [];
    paths.forEach((path) => {
      let pathToAdd = []
      path.subgraph.forEach((item, i)=> {
        if(!item)
          return;
        if(i % 2 === 0) {
          let name = (item.names) ? item.names[0]: '';
          let type = (item.types) ? item.types[0]: '';
          let desc = (item.description) ? item.description[0]: '';
          let category = (i === path.subgraph.length - 1) ? 'target' : 'object';
          pathToAdd[i] = {
            category: category,
            name: name,
            type: type,
            description: desc,
          }
        } else {
          let pred = (item.predicates) ? formatBiolinkPredicate(item.predicates[0]) : '';
          pathToAdd[i] = {
            category: 'predicate',
            predicates: [pred],
          }
        }
      })
      newGraph.push(pathToAdd);
    }) 
    setRawGraph(newGraph);
    setCompressedGraph(generateCompressedGraph(newGraph));
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

  const handlePathClick = (path) => {
    console.log("handle path click");
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

  const checkForNodeUniformity = (pathOne, pathTwo) => {
    // if the lengths of the paths are different, they cannot have the same nodes
    if(pathOne.length !== pathTwo.length) 
      return false;
      
    let nodesMatch = true;

    for(const [i, path] of pathOne.entries()) {
      // if we're at an odd index, it's a predicate, so skip it
      if(i % 2 !== 0) 
        continue;

      // if the names of the nodes don't match, set nodesMatch to false 
      if(path.name !== pathTwo[i].name) 
        nodesMatch = false;
    }
    return nodesMatch;
  }

  const generateCompressedGraph = (graph) => {
    let newCompressedGraph = [];
    let pathToDisplay = null
    let numCompressedElements = 0;
    for(const [i, path] of graph.entries()) {
      if(pathToDisplay === null)
        pathToDisplay = cloneDeep(path);
      let displayPath = false;
      let nextPath = (graph[i+1] !== undefined) ? graph[i+1] : null;
      let nodesEqual = (nextPath) ? checkForNodeUniformity(pathToDisplay, nextPath) : false;
      // if all nodes are equal
      // compare predicates, combine them where different
      // display final 'version' of path
      
      // if theres another path after the current one, and the nodes of each are equal
      if(nextPath && nodesEqual) {
        // loop through the current path's items
        for(const [i, item] of path.entries()) {
          if(displayPath) {
            break;
          }
          // if we're at an even index, it's a node, so skip it
          if(i % 2 === 0) 
            continue;

          if(!nextPath[i]) 
            continue;
          
          // loop through nextPath's item's predicates
          for(const predicate of nextPath[i].predicates) {
            // if the next path item to be displayed doesn't have the predicate, 
            if(!pathToDisplay[i].predicates.includes(predicate)) {
              // add it and increment the number of compressed elements 
              pathToDisplay[i].predicates.push(predicate);
              numCompressedElements++;
            }
          }
        }
      }
      // if there's no nextPath or the nodes are different, display the path 
      if(!nextPath || !nodesEqual) {
        displayPath = true;
      } 
      
      if(displayPath) {
        newCompressedGraph.push(pathToDisplay);
        pathToDisplay = null;
      } 
    }

    setNumberOfCompressedElements(numCompressedElements);

    return newCompressedGraph;
  }

  return(
    <div className={styles.graphView}>
      <div className={styles.tableHead}>
        {displayHeadings(graphWidth)}
      </div>
      {
        compressedGraph.slice(0, numberToShow).map((pathToDisplay, i)=> {
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
                    handlePathClick={handlePathClick}
                    handleTargetClick={handleTargetClick}
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
          (numberToShow < rawGraph.length - numberOfCompressedElements) &&
          <button onClick={(e)=> {e.stopPropagation(); handleShowMore();}} className={styles.show}>Show More</button>
        }
        {
          (numberToShow <= rawGraph.length - numberOfCompressedElements && numberToShow > 6) &&
          <button onClick={(e)=> {e.stopPropagation(); handleShowLess();}} className={styles.show}>Show Less</button>
        }
      </div>
    </div>
  )
}

export default GraphView;