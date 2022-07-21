import styles from './GraphView.module.scss';
import React, {useState, useEffect} from "react";
import Tooltip from '../Tooltip/Tooltip';
import { getIcon } from '../../Utilities/utilities';
import {ReactComponent as Disease} from '../../Icons/disease2.svg';
import {ReactComponent as Connector} from '../../Icons/connector-os.svg';
import {ReactComponent as Chemical} from '../../Icons/Queries/Chemical.svg';
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
      id: '1234'
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
      id: '43525'
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
      id: '3456'
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
      id: '6134'
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
          console.log(i);
          return (
            <div className={styles.tableItem} key={i}> 
              {
                element.path.map((path, j) => {
                  let key = `${i}_${j}`;
                  console.log(key);
                  return (
                    <GraphPath 
                      path={path} 
                      key={key}
                      handleNameClick={handleNameClick}
                      handlePathClick={handlePathClick}
                      handleTargetClick={handleTargetClick}
                      >
                      
                    </GraphPath>
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