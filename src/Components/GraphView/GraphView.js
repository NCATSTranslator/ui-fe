import styles from './GraphView.module.scss';
import {useState, memo, useMemo, useRef, useCallback} from 'react';
import { resultToCytoscape, findPaths, layoutList, handleResetView, 
  handleDeselectAllNodes, initCytoscapeInstance, getGraphWithoutExtraneousPaths } from '../../Utilities/graphFunctions';
import cytoscape from 'cytoscape';
import { v4 as uuidv4 } from 'uuid';
import klay from 'cytoscape-klay';
import dagre from 'cytoscape-dagre';
import avsdf from 'cytoscape-avsdf';
import { useEffect } from 'react';
import { cloneDeep } from 'lodash';
import GraphLayoutButtons from '../GraphLayoutButtons/GraphLayoutButtons';

const GraphView = ({result, rawResults, onNodeClick, clearSelectedPaths, active}) => {

  let graphRef = useRef(null);
  const [currentLayout, setCurrentLayout] = useState(layoutList.klay);
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

  const calculatedPaths = useRef(null);
  
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

    const objectIds = new Set();
    for(const node of ev.cy.elements('node')) {
      if(node.data('isSourceCount') === 0) {
        objectIds.add(node.data('id'));
      }
    }

    // Only calculate paths once
    let paths = new Set();
    if(calculatedPaths.current) {
      paths = cloneDeep(calculatedPaths.current);
    } else {
      let newGraph = getGraphWithoutExtraneousPaths(graph);
      calculatedPaths.current = findPaths(subjectId.current, objectIds, newGraph);
      paths = cloneDeep(calculatedPaths.current);
    }
    
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
    return initCytoscapeInstance(cytoReqDataObject)
  }, [result, rawResults, graphRef, graph, currentLayout, active, clearSelectedPaths, handleNodeClick]);

  useEffect(() => {
    return () => {
      if(cy !== null)
        cy.destroy();
    };
  });

  return (
    <div className={styles.GraphView}>
      <GraphLayoutButtons setCurrentLayout={setCurrentLayout} currentLayout={currentLayout} />
      <div className={styles.graphContainer} >
        <div className={styles.graphControls}>
          <button 
            onClick={()=>handleResetView(cy)}
            >
            Reset View
          </button>
          <button 
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