import styles from './GraphView.module.scss';
import React, {useRef, useState, useEffect} from 'react';
import {Graph} from 'cytoscape-react';
import exampleOutput from '../../Data/exampleOutput.json';
import { resultToCytoscape } from '../../Utilities/graphFunctions';

const GraphView = ({result, rawResults}) => {

  const [currentLayout, setCurrentLayout] = useState('breadthfirst');
  const [cyParams, setCyParams] = useState({});

  const cyRef = useRef(null);


  useEffect(() => {
    console.log(result);
    console.log(exampleOutput.results[0])
    // let newResultData = resultToCytoscape(result, rawResults.data);

    // setCyParams({
    //   elements: newResultData,
    //   style: graphStyles
    // })
  }, [result, rawResults]);

  const graphStyles = [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        'background-color': '#ccc',
      },
    },
    {
      selector: 'edge',
      style: {
        width: 3,
        'line-color': '#777',
        'target-arrow-color': '#777',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
      },
    },
  ];

  return (
    <div className={styles.GraphView}>
      <div className="sidebar" style={{padding: '20px'}}>
        <button onClick={()=>setCurrentLayout('breadthfirst')}>Breadthfirst</button>
        <button onClick={()=>setCurrentLayout('random')}>Random</button>
        <button onClick={()=>setCurrentLayout('circle')}>Circle</button>
        <button onClick={()=>setCurrentLayout('concentric')}>Concentric</button>
        <button onClick={()=>setCurrentLayout('cose')}>Cose</button>
      </div>
      <h3>Current Type: <strong>{currentLayout}</strong></h3>
      <div style={{width: '1200px', height:'600px', margin: '0 auto', border: '1px solid black'}}>
        <Graph layoutParams={{ name: currentLayout, fit: true, spacingFactor: 5 }} cyParams={cyParams}></Graph>
      </div>
    </div>
  );
}

export default GraphView;