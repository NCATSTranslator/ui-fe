import styles from './GraphView.module.scss';
import React, {useState, useEffect} from "react";
import GraphPath from '../GraphPath/GraphPath';

const GraphView = ({graph, staticNode}) => {

  graph = [
    {
      path: [
        {
          name: 'Glucose',
          type: 'chemical',
          path: 'treats',
          target: 'Diabetes'
        }
      ],
    },
    {
      path: [
        {
          name: 'Glucose',
          type: 'chemical',
          path: 'reduces expression of',
        },
        {
          name: 'Gene A',
          type: 'gene',
          path: 'causes',
          target: 'Diabetes'
        }
      ],
    },
    {
      path: [
        {
          name: 'Glucose',
          type: 'chemical',
          path: 'treats',
        },
        {
          name: 'Phenotype B',
          type: 'phenotype',
          path: 'associated with',
          target: 'Diabetes'
        }
      ],
    },
    {
      path: [
        {
          name: 'Glucose',
          type: 'chemical',
          path: 'treats',
        },
        {
          name: 'Disease C',
          type: 'disease',
          path: 'causes',
        },
        {
          name: 'Phenotype D',
          type: 'phenotype',
          path: 'associated with',
          target: 'Diabetes'
        }
      ],
    }
  ]

  let graphWidth = 0;
  for (let index = 0; index < graph.length; index++) {
    if(graph[index].path.length > graphWidth)
    graphWidth = graph[index].path.length; 
  }

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


  return(
    <div className={styles.graphView}>
      <div className={styles.tableHead}>
        {displayHeadings(graphWidth)}
      </div>
      {
        graph.map((element, i) => {
          return (
            <div className={styles.tableItem} key={i}> 
              {
                element.path.map((path, j) => {
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
        })
      }
    </div>
  )
}

export default GraphView;