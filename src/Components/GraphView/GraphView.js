import styles from './GraphView.module.scss';
import React, {useState, useEffect} from "react";
import GraphPath from '../GraphPath/GraphPath';

const GraphView = ({paths}) => {

  
  const formatPredicate = (predicate) => {
    return predicate.replace('biolink:', '').replaceAll('_', ' '); 
  }
  
  const [graph, setGraph] = useState([])
  let initialNumberToShow = (paths.length < 6) ? paths.length : 6;
  const [numberToShow, setNumberToShow] = useState(initialNumberToShow);

  useEffect(() => {
    let newGraph = [];
    paths.forEach((path) => {
      let pathToAdd = []
      path.subgraph.forEach((item, i)=> {
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
          let pred = (item.predicates) ? formatPredicate(item.predicates[0]) : '';
          pathToAdd[i] = {
            category: 'predicate',
            predicate: pred,
          }
        }
      })
      newGraph.push(pathToAdd);
    }) 
    setGraph(newGraph);
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
    let newAmount = (numberToShow - 6 <= 6) ? paths.length - (numberToShow - 6) : numberToShow - 6;
    setNumberToShow(newAmount);
  }



  useEffect(() => {
    initialNumberToShow = (paths.length < 6) ? paths.length : 6;
    setNumberToShow(initialNumberToShow);
  }, [paths]);


  return(
    <div className={styles.graphView}>
      <div className={styles.tableHead}>
        {displayHeadings(graphWidth)}
      </div>
      {
        graph.map((element, i) => {
          if(i < numberToShow) {
            return (
              <div className={styles.tableItem} key={i}> 
                {
                  element.map((path, j) => {
                    let key = `${i}_${j}`;
                    return (
                      <GraphPath 
                        path={path} 
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
          }
        })
      }
      {
        (numberToShow < graph.length) &&
        <button onClick={handleShowMore}>Show More</button>
      }
      {
        (numberToShow === graph.length && numberToShow > 6) &&
        <button onClick={handleShowLess}>Show Less</button>
      }
    </div>
  )
}

export default GraphView;