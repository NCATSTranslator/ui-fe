import styles from './GraphView.module.scss';
import {useState, memo, useMemo, useRef, useCallback} from 'react';
import { resultToCytoscape, findPaths, layoutList } from '../../Utilities/graphFunctions';
import cytoscape from 'cytoscape';
import { v4 as uuidv4 } from 'uuid';
import klay from 'cytoscape-klay';
import dagre from 'cytoscape-dagre';
import avsdf from 'cytoscape-avsdf';
import { useEffect } from 'react';

/**
* Resets the cytoscape viewport to the default view.
* @param {Object} cy - A cytoscape instance.
* @returns {void}
*/
const handleResetView = (cy) => {
  if(!cy)
    return;

  return cy.fit(cy.elements(), 20);
}

/**
* Clears both selected and excluded nodes to reset graph state
* @param {Set} selNodes - A set containing the user's selected nodes.
* @param {Set} excNodes - A set containing the user's excluded nodes.
* @returns {void}
*/
const handleDeselectAllNodes = (cy, selNodes, excNodes, clearSelectedPaths, classes) => {
  cy.elements().removeClass([classes.highlightClass, classes.hideClass, classes.excludedClass]);
  selNodes.current.clear();
  excNodes.current.clear();
  clearSelectedPaths();
}


/**
* Initializes a Cytoscape instance with the specified data and options.
* @param {Object} result - An object representing the result to be displayed in the graph.
* @param {Object} summary - An object containing the raw results information from the BE.
* @param {Object} dataObj - An object containing various options and data used to configure and interact with the Cytoscape instance.
* @returns {void}
*/
const initCytoscapeInstance = (result, summary, dataObj) => {
  let cy = cytoscape({
    container: dataObj.graphRef.current,
    elements: dataObj.graph,
    layout: dataObj.layout,
    style: [
      {
        selector: 'node',
        style: {
          'content': 'data(label)',
          'shape': 'round-rectangle',
          'text-valign': 'center',
          'text-halign': 'center',
          'width': '206px',
          'height': 'data(height)',
          'padding': '8px',
          'color': '#000',
          'background-color': '#fff',
          'border-color': '#000',
          'border-width': '2px',
          'text-wrap': 'wrap',
          'text-max-width': '190px',
          'font-weight': 'bold'
        }
      },
      {
        selector: `[id = '${dataObj.objectId}']`,
        style: {
          'background-color': '#2d5492',
          'color': '#fff',
          'border-width': '0px',
        }
      },
      {
        selector: `[id = '${dataObj.subjectId}']`,
        style: {
          'background-color': '#fbaf00',
          'border-width': '0px',
        }
      },
      {
        selector: 'edge',
        style: {
          'line-color': '#CED0D0'
        }
      },
      {
        selector: 'edge.highlight',
        style: {
          'line-color': '#000',
          'opacity': '1.0'
        }
      },
      {
        selector: '.hover-highlight',
        style: {
          'line-color': '#606368'
        }
      },
      {
        selector: '.hide',
        style: {
          'opacity': '0.3'
        }
      },
      {
        selector: '.excluded',
        style: {
          'background-color': 'red'
        }
      },
    ],
    data: {
      result: 0
    }
  });

  cy.unbind('vclick');
  cy.bind('vclick', 'node', (ev, formattedResults)=>dataObj.handleNodeClick(ev, formattedResults, dataObj.graph));

  // when background is clicked, remove highlight and hide classes from all elements
  cy.bind('click', (ev) => {
    if(ev.target === cy) {
      handleDeselectAllNodes(
        ev.cy, 
        dataObj.selectedNodes, 
        dataObj.excludedNodes, 
        dataObj.clearSelectedPaths, 
        {highlightClass: dataObj.highlightClass, hideClass: dataObj.hideClass, excludedClass: dataObj.excludedClass}
      );
    }
  });

  // Set bounds of zoom
  cy.maxZoom(4.5);
  cy.minZoom(.075);
  return cy;
}

const GraphView = ({result, rawResults, onNodeClick, clearSelectedPaths, active}) => {

  let graphRef = useRef(null);
  const [currentLayout, setCurrentLayout] = useState(layoutList.klay)
  const graph = useMemo(() => {
    if(!active)
      return null;

    return resultToCytoscape(result.rawResult, rawResults.data)
  },[result, rawResults, active])
  
  const selectedNodes = useRef(new Set());
  const excludedNodes = useRef(new Set());
  const highlightClass = 'highlight';
  const hideClass = 'hide';
  const excludedClass = 'excluded';
  
  const subjectId = useRef(result.rawResult.subject);
  const objectId = useRef(result.rawResult.object);
  
  // initialize 3rd party layouts
  cytoscape.use(klay);
  cytoscape.use(avsdf);
  cytoscape.use(dagre);

  /**
  * Highlights the given element by adding the highlightClass and removing the hideClass.
  * @param {object} element - The cytoscape element to be highlighted.
  */
  const highlightElement = (element) => {
    element.addClass(highlightClass);
    element.removeClass(hideClass);
  }

  /**
  * Hides the given element by removing the highlightClass and adding the hideClass.
  * @param {object} element - The cytoscape element to be hidden.
  */
  const hideElement = (element) => {
    element.removeClass(highlightClass);
    element.addClass(hideClass);
  }

  /**
  * Handles a node click event and calls the onNodeClick callback function with an array of paths and formatted paths.
  * @param {Object} ev - The event object.
  * @param {Array} formattedPaths - An array of formatted paths.
  * @param {Object} graph - The graph object.
  * @returns {void}
  */
  const handleNodeClick = useCallback((ev, formattedPaths, graph) => {
    const targetId = ev.target.id();

    if(selectedNodes.current.has(targetId)) {
      selectedNodes.current.delete(targetId);
      excludedNodes.current.add(targetId);
    } else if(excludedNodes.current.has(targetId)) {
      selectedNodes.current.add(targetId);
      excludedNodes.current.delete(targetId);
    } else if(ev.target.hasClass(highlightClass)) {
      excludedNodes.current.add(targetId);
    } else if (ev.target.hasClass(hideClass)){
      selectedNodes.current.add(targetId);
    } else {
      selectedNodes.current.add(targetId);
    } 

    // init graph by hiding all elements
    ev.cy.elements().removeClass(excludedClass)
    hideElement(ev.cy.elements());

    const paths = findPaths(subjectId.current, objectId.current, graph);
    
    // Handle excluded nodes and a lack of selected nodes in a path
    paths.forEach((path) => {
      let hasSelectedNode = false;
      let hasExcludedNode = false;
      for(const nodeId of selectedNodes.current) {
        if(path.includes(nodeId))
          hasSelectedNode = true;
      }
      for(const nodeId of excludedNodes.current) {
        if(path.includes(nodeId))
          hasExcludedNode = true;
      }
      // If a path has no selected nodes, or has an excluded node, remove it from the list 
      if(!hasSelectedNode || hasExcludedNode) 
        paths.delete(path);
    })

    paths.forEach((path) => {
      for(const nodeId of path) {
        let node = ev.cy.getElementById(nodeId)
        highlightElement(node)
        for(const edge of node.connectedEdges()) {
          if(path.includes(edge.source().id()) && path.includes(edge.target().id()))
            highlightElement(edge)
        }
      }
    })

    for(const nodeId of excludedNodes.current) {
      ev.cy.getElementById(nodeId).addClass('excluded');
    }

    onNodeClick(paths, formattedPaths);

  }, [onNodeClick])

  const cy = useMemo(()=>{
    if(!active || !graphRef.current || graph === null)
      return null;

    let cytoReqDataObject = {
      graphRef: graphRef, 
      graph: graph, 
      layout: currentLayout, 
      selectedNodes: selectedNodes, 
      excludedNodes: excludedNodes,
      handleNodeClick: handleNodeClick, 
      clearSelectedPaths: clearSelectedPaths,
      highlightClass: highlightClass, 
      hideClass: hideClass, 
      excludedClass: excludedClass,
      subjectId: subjectId.current,
      objectId: objectId.current
    }
    return initCytoscapeInstance(result.rawResult, rawResults.data, cytoReqDataObject)
  }, [result, rawResults, graphRef, graph, currentLayout, active, clearSelectedPaths, handleNodeClick]);

  useEffect(() => {
    return () => {
      if(cy !== null)
        cy.destroy();
    };
  });

  return (
    <div className={styles.GraphView}>
      <div className={styles.sidebar}>
        <h4 className={styles.layoutHeader}>Layout Type:</h4>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'klay')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.klay)}>Klay</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'breadthfirst')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.breadthfirst)}>Breadthfirst</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'dagre')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.dagre)}>dagre</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'random')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.random)}>Random</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'avsdf')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.avsdf)}>avsdf</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'circle')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.circle)}>Circle</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'concentric')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.concentric)}>Concentric</button>
        <button className={`${styles.layoutButton} ${(currentLayout.name === 'cose')? styles.active : ''}`} onClick={()=>setCurrentLayout(layoutList.cose)}>Cose</button>
      </div>
      <div className={styles.graphContainer} >
        <div className={styles.graphControls}>
          <button className={`${styles.layoutButton} ${styles.active}`} onClick={()=>handleResetView(cy)}>Reset View</button>
          <button 
            className={`${styles.layoutButton} ${styles.active}`} 
            onClick={() => {
              handleDeselectAllNodes(
                cy, 
                selectedNodes, 
                excludedNodes, 
                clearSelectedPaths, 
                {highlightClass: highlightClass, hideClass: hideClass, excludedClass: excludedClass})
              }
            }
            >
            Deselect All Nodes
          </button>
        </div>
        <div id={`cy-${uuidv4()}`} ref={graphRef} className={`${styles.cytoscapeContainer} cytoscape-container`}></div>
      </div>
    </div>
  );
}

export default memo(GraphView);