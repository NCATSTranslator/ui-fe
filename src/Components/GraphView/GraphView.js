import styles from './GraphView.module.scss';
import React, {useState} from "react";
import { getIcon } from '../../Utilities/utilities';
import {ReactComponent as Disease} from '../../Icons/disease2.svg';
import {ReactComponent as Connector} from '../../Icons/connector-os.svg';
import {ReactComponent as Chemical} from '../../Icons/Queries/Chemical.svg';

const GraphView = ({graph, staticNode}) => {

  const entityHeading = <span>Entity</span>;
  const relationshipHeading = <span>Relationship</span>;
  const targetHeading = <span>Target</span>;

 graph = [
  {
    path: [
      {
        name: 'Glucose',
        type: 'chemical',
        path: 'treats',
        target: 'Diabetes'
      }
    ]
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
    ]
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
    ]
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
    ]
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
    headingMarkup.push(entityHeading);
    headingMarkup.push(relationshipHeading);
  }
  headingMarkup.push(targetHeading);
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
          console.log(element);
          return (
            <div className={styles.tableItem}> 
              {
                element.path.map((path, j) => {
                  return (
                    <> 
                      <span className={styles.name} onClick={()=>handleNameClick(path.name)}>
                        {getIcon(path.type)}
                        {path.name}
                      </span>
                      <span className={styles.pathContainer} onClick={()=>handlePathClick(path.path)}>
                        <Connector />
                        <span className={`${styles.path} path`}>{path.path}</span>
                      </span>
                      {path.target && 
                      <span className={styles.target} onClick={()=>handleTargetClick(path.target)} >
                        <Disease/>
                        {path.target}
                      </span>}
                    </>
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