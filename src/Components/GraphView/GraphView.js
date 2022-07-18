import styles from './GraphView.module.scss';
import React, {useState} from "react";
import {ReactComponent as Disease} from '../../Icons/disease2.svg';
import {ReactComponent as Connector} from '../../Icons/connector-os.svg';

const GraphView = ({graph, staticNode}) => {

  const entityHeading = <span>Entity</span>;
  const relationshipHeading = <span>Relationship</span>;
  const targetHeading = <span>Target</span>;

 graph = [
  {
    path: [
      {
        name: 'Glucose',
        path: 'treats',
        target: 'Diabetes'
      }
    ]
  },
  {
    path: [
      {
        name: 'Glucose',
        path: 'reduces expression of',
      },
      {
        name: 'Gene A',
        path: 'causes',
        target: 'Diabetes'
      }
    ]
  },
  {
    path: [
      {
        name: 'Glucose',
        path: 'treats',
      },
      {
        name: 'Phenotype B',
        path: 'associated with',
        target: 'Diabetes'
      }
    ]
  },
  {
    path: [
      {
        name: 'Glucose',
        path: 'treats',
      },
      {
        name: 'Disease C',
        path: 'causes',
      },
      {
        name: 'Phenotype D',
        path: 'associated with',
        target: 'Diabetes'
      }
    ]
  }
 ]

 let graphWidth = 0;
 for (let index = 0; index < graph.length; index++) {
   if(graph[index].path.length > graphWidth)
    graphWidth = graph[index].path.length; 
 }
 console.log(graphWidth);

 const displayHeadings = (count) => {
  let headingMarkup = [];
  for (let index = 0; index < count; index++) {
    headingMarkup.push(entityHeading);
    headingMarkup.push(relationshipHeading);
  }
  headingMarkup.push(targetHeading);
  return headingMarkup;
 }

  return(
    <div className={`${styles.container}`}>
      <div className={styles.graphView}>
        <div className={styles.tableHead}>
          {displayHeadings(graphWidth)}
        </div>
        {
          graph.map((element, i) => {
            console.log(element);
            return (
              <div className={styles.tableItem}> 
                {
                  element.path.map((path, j) => {
                    return (
                      <> 
                        <span className={styles.name}>{path.name}</span>
                        <span className={styles.pathContainer}>
                          <Connector />
                          <span className={styles.path}>{path.path}</span>
                        </span>
                        {path.target && <span className={styles.target}><Disease/>{path.target}</span>}
                      </>
                    ) 
                  }) 
                }
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export default GraphView;