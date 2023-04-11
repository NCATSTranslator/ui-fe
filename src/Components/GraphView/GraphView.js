import styles from './GraphView.module.scss';
import {useState, useEffect, memo, useRef, useCallback} from 'react';
import { resultToCytoscape, findPaths, layoutList } from '../../Utilities/graphFunctions';
import cytoscape from 'cytoscape';
import { v4 as uuidv4 } from 'uuid';
import klay from 'cytoscape-klay';
import dagre from 'cytoscape-dagre';
import avsdf from 'cytoscape-avsdf';

const GraphView = ({result, rawResults, onNodeClick}) => {

  let graphRef = useRef(null);
  let cy = null;
  const [currentLayout, setCurrentLayout] = useState(layoutList.breadthfirst)
  const [graph, setGraph] = useState({})
  const selectedNodes = useRef(new Set());
  const excludedNodes = useRef(new Set());
  const highlightClass = 'highlight';
  const hideClass = 'hide';
  const excludedClass = 'excluded';

  const subjectID = result.rawResult.subject;
  const objectID = result.rawResult.object;

  // initialize 3rd party layouts
  cytoscape.use(klay);
  cytoscape.use(avsdf);
  cytoscape.use(dagre);

  useEffect(() => {
    let newGraph = resultToCytoscape(result.rawResult, rawResults.data);
    setGraph(newGraph);
  }, [result, rawResults]);

  const highlightElement = (element) => {
    element.addClass(highlightClass);
    element.removeClass(hideClass);
  }
  const hideElement = (element) => {
    element.removeClass(highlightClass);
    element.addClass(hideClass);
  }

  const handleNodeClick = useCallback((ev) => {
    const targetId = ev.target.id();

    if(selectedNodes.current.has(targetId)) {
      selectedNodes.current.delete(targetId);
      excludedNodes.current.add(targetId);
    } else if(excludedNodes.current.has(targetId)) {
      selectedNodes.current.add(targetId);
      excludedNodes.current.delete(targetId);
    } else if(ev.target.hasClass(highlightClass) || ev.target.hasClass(hideClass)) {
      excludedNodes.current.add(targetId);
    } else {
      selectedNodes.current.add(targetId);
    } 

    // init graph by hiding all elements
    ev.cy.elements().removeClass(excludedClass)
    hideElement(ev.cy.elements());

    const paths = findPaths(subjectID, objectID, graph);
    
    // Handle excluded nodes and a lack of selected nodes in a path
    paths.forEach((path) =>{
      let hasSelectedNode = false;
      let hasExcludedNode = false;
      selectedNodes.current.forEach((nodeID) => {
        if(path.includes(nodeID))
          hasSelectedNode = true;
      })
      excludedNodes.current.forEach((nodeID) => {
        if(path.includes(nodeID))
          hasExcludedNode = true;
      })
      // If a path has no selected nodes, or has an excluded node, remove it from the list 
      if(!hasSelectedNode || hasExcludedNode) 
        paths.delete(path);
    })

    paths.forEach((path) => {
      path.forEach((nodeId) => {
        // if(nodeId !== subjectID && nodeId !== objectID)
        //   selectedNodes.current.add(nodeId);

        let node = ev.cy.getElementById(nodeId)
        highlightElement(node)
        node.connectedEdges().forEach(edge=>{
          if(path.includes(edge.source().id()) && path.includes(edge.target().id()))
            highlightElement(edge)
        })
      })
    })

    excludedNodes.current.forEach((nodeId) => {
      ev.cy.getElementById(nodeId).addClass('excluded');
    })

    console.log(selectedNodes.current)
    console.log(excludedNodes.current)

    onNodeClick(paths);

  }, [subjectID, objectID, onNodeClick, graph])

  const initCytoscapeInstance = useCallback((result, summary, graphRef, layout, cy) => {

    cy = cytoscape({
      container: graphRef.current,
      elements: resultToCytoscape(result, summary),
      layout: layout,
      style: cytoscape.stylesheet()
        .selector('node')
          .css({
            'id': 'data(id)',
            'content': 'data(label)',
            'shape': 'round-rectangle',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '206px',
            'height': '40px',
            'padding': '8px',
            'color': '#fff',
            'background-color': '#2d5492',
            'border-width': '0px',
          })
        .selector('edge')
          .css({
            'line-color': '#CED0D0'
          })
        .selector('edge.highlight')
          .css({
            'line-color': '#000',
            'opacity': '1.0'
          })
        .selector('.hover-highlight')
          .css({
            'line-color': '#606368'
          })
        .selector('.hide')
          .css({
            'opacity': '0.3'
          })
        .selector('.excluded')
        .css({
          'background-color': 'red'
        }),
      data: {
        result: 0
      }
    });

    cy.unbind('vclick');
    cy.bind('vclick', 'node', handleNodeClick);
    // addClassToConnections('hover-highlight', 'hide', 'mouseover', summary, cy);

    // when background is clicked, remove highlight and hide classes from all elements
    cy.bind('click', (ev) => {
      if(ev.target === cy) {
        ev.cy.elements().removeClass([highlightClass, hideClass, excludedClass]);
        selectedNodes.current.clear();
        excludedNodes.current.clear();
      }
    });    
  
  },[selectedNodes, handleNodeClick, graph]);
  
  useEffect(() => {
    if(graphRef.current) {
      initCytoscapeInstance(result.rawResult, rawResults.data, graphRef, currentLayout, cy);
    }
  }, [result, rawResults, currentLayout, initCytoscapeInstance, cy]);

  return (
    <div className={styles.GraphView}>
      <div className={styles.sidebar}>
        <h4 className={styles.layoutHeader}>Layout Type:</h4>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'breadthfirst')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.breadthfirst)}>Breadthfirst</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'dagre')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.dagre)}>dagre</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'klay')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.klay)}>Klay</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'random')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.random)}>Random</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'avsdf')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.avsdf)}>avsdf</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'circle')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.circle)}>Circle</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'concentric')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.concentric)}>Concentric</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'cose')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.cose)}>Cose</button>
      </div>
      <div className={styles.graphContainer} >
        <div id={`cy-${uuidv4()}`}ref={graphRef} className={`${styles.cytoscapeContainer} cytoscape-container`}></div>
      </div>
    </div>
  );
}

export default memo(GraphView);