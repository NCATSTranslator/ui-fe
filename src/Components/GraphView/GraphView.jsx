import styles from './GraphView.module.scss';
import {useState, memo, useMemo, useRef, useCallback, useEffect} from 'react';
import { resultToCytoscape, findPaths, layoutList, handleResetView, 
  handleDeselectAllNodes, initCytoscapeInstance, getGraphWithoutExtraneousPaths,
  handleZoomByInterval } from '../../Utilities/graphFunctions';
import Plus from '../../Icons/Buttons/Add.svg?react';
import Minus from '../../Icons/Buttons/Subtract.svg?react';
import cytoscape from 'cytoscape';
import { v4 as uuidv4 } from 'uuid';
import klay from 'cytoscape-klay';
import dagre from 'cytoscape-dagre';
import avsdf from 'cytoscape-avsdf';
import { cloneDeep } from 'lodash';
import AnimateHeight from "react-animate-height";
import GraphLayoutButtons from '../GraphLayoutButtons/GraphLayoutButtons';
import navigator from 'cytoscape-navigator';
import popper from 'cytoscape-popper';
import 'cytoscape-navigator/cytoscape.js-navigator.css';
import { useSelector } from 'react-redux';
import { currentPrefs } from '../../Redux/rootSlice';

const getInitialGraphLayoutFromPrefs = (prefs, layoutList) => {
  let graphLayoutPref = (prefs?.graph_layout?.pref_value) ? prefs.graph_layout.pref_value : "vertical";
  switch (graphLayoutPref) {
    case "horizontal":
      graphLayoutPref = layoutList.breadthfirst;
      break;
    case "concentric":
      graphLayoutPref = layoutList.concentric;
      break;
    default:
      graphLayoutPref = layoutList.klay;
      break;
  }
  return graphLayoutPref;
}

// initialize 3rd party layouts
cytoscape.use(klay);
cytoscape.use(avsdf);
cytoscape.use(dagre);
cytoscape.use(navigator);
cytoscape.use(popper);
cytoscape.warnings(false);

const GraphView = ({result, rawResults, onNodeClick, clearSelectedPaths, active, zoomKeyDown, updateGraphFunction, prebuiltGraph}) => {

  const prefs = useSelector(currentPrefs);

  let graphRef = useRef(null);
  let graphViewRef = useRef(null);
  let graphLayoutPref = getInitialGraphLayoutFromPrefs(prefs, layoutList);
  const [currentLayout, setCurrentLayout] = useState(graphLayoutPref);
  const graph = useMemo(() => {
    // if(!active)
    //   return null;
    if(prebuiltGraph)
      return prebuiltGraph;

    if(rawResults) {
      let temp = resultToCytoscape(result.rawResult, rawResults.data);
      updateGraphFunction(temp);
      return temp;
    }

    return null;

  },[result, rawResults, prebuiltGraph, updateGraphFunction])


  const graphVisibilityPref = (prefs?.graph_visibility) ? prefs.graph_visibility.pref_value: 'sometimes';
  let initIsExpanded = true; 
  switch (graphVisibilityPref) {
    case "sometimes":
      initIsExpanded = (result?.compressedPaths && result.compressedPaths.length > 1) ? true : false;
      break;
    case "never":
      initIsExpanded = false;
      break;
    default:
      break;
  }
  const [isExpanded, setIsExpanded] = useState(initIsExpanded);
  const [height, setHeight] = useState(0);
  
  const selectedNodes = useRef(new Set());
  const excludedNodes = useRef(new Set());
  const highlightClass = 'highlight';
  const hideClass = 'hide';
  const excludedClass = 'excluded';
  
  const subjectId = useRef(result.rawResult.subject);
  const objectId = useRef(result.rawResult.object);

  const calculatedPaths = useRef(null);
  const cyNav = useRef(null);

  const graphId = useRef(uuidv4());
  const graphIdString = `cy-${graphId.current}`;
  const edgeInfoWindowIdString = useRef(`edgeInfoWindow-${graphId.current}`);
  const graphTooltipIdString = useRef(`graphTooltip-${graphId.current}`);
  const graphNavigatorContainerId = useRef(`cy-nav-container-${graphId.current}`);
  const graphScrollOverlayId = useRef(`cy-scroll-overlay-${graphId.current}`);

  const [scrollOverlayActive, setScrollOverlayActive] = useState(false);
  const overlayTimeoutId = useRef(null);

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
    for(const path of paths) {
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
      // If a path has no selected nodes, or has an excluded node, 
      // remove it from the list and move on to the next path
      if(!hasSelectedNode || hasExcludedNode) {
        paths.delete(path);
        continue;
      }
      for(const nodeId of path) {
        let node = ev.cy.getElementById(nodeId)
        highlightElement(node)
        for(const edge of node.connectedEdges()) {
          if(path.includes(edge.source().id()) && path.includes(edge.target().id()))
            highlightElement(edge)
        }
      }
    }

    for(const nodeId of excludedNodes.current) {
      ev.cy.getElementById(nodeId).addClass('excluded');
    }

    onNodeClick(paths, formattedPaths);

  }, [onNodeClick])

  const cy = useMemo(()=>{
    if(!active || !graphRef.current || graph === null || height !== 'auto')
      return null;

    let cytoReqDataObject = {
      graphRef: graphRef, 
      graphNavigatorContainerId: graphNavigatorContainerId.current,
      graphTooltipIdString: graphTooltipIdString.current,
      edgeInfoWindowIdString: edgeInfoWindowIdString.current,
      graphScrollOverlayId: graphScrollOverlayId.current, 
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
      objectId: objectId.current,
      cyNav: cyNav.current
    }
    let cyInstanceAndNav = initCytoscapeInstance(cytoReqDataObject);
    cyNav.current = cyInstanceAndNav.nav;

    if(cyInstanceAndNav.cy.data().layoutName === 'breadthfirst') {
      var heightOffset = 200;
      var objectNode = cyInstanceAndNav.cy.$(`[id = '${objectId.current}']`);

      var maxY = cyInstanceAndNav.cy.nodes().max((node) => node.position('y')).value;
      var minX = cyInstanceAndNav.cy.nodes().min((node) => node.position('x')).value;
      var maxX = cyInstanceAndNav.cy.nodes().max((node) => node.position('x')).value;
    
      var centerX = (minX + maxX) / 2;
    
      objectNode.position({ x: centerX, y: maxY + heightOffset });
      handleResetView(cyInstanceAndNav.cy);
    }

    return cyInstanceAndNav.cy;
  }, [graphRef, graph, currentLayout, active, clearSelectedPaths, handleNodeClick, height]);

  useEffect(() => {
    if(cy) {
      cy.userZoomingEnabled(zoomKeyDown);
    }

    const handleWheel = () => {
      if (!zoomKeyDown) {
        setScrollOverlayActive(true);

        // Clear the previous timeout, if there is one
        if (overlayTimeoutId.current !== null) {
          clearTimeout(overlayTimeoutId.current);
        }

        overlayTimeoutId.current = setTimeout(() => {
          setScrollOverlayActive(false);
          overlayTimeoutId.current = null;
        }, 1500);
      }
    };
  
    const retainedGraphViewRef = graphViewRef.current;
    if (graphViewRef.current) 
      graphViewRef.current.addEventListener('wheel', handleWheel);
  
    return () => {
      if (retainedGraphViewRef) 
        retainedGraphViewRef.removeEventListener('wheel', handleWheel);
    };
  }, [zoomKeyDown, graphViewRef, cy]);
  
  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded]);
  
  return (
    <div >
      <button onClick={()=>setIsExpanded(prev=>!prev)} className={styles.toggleButton}>
        {isExpanded ? 'Hide': 'Show'} Graph View
      </button>
      <AnimateHeight
        duration={500}
        height={height}
        className={styles.animateHeightContainer}
        >
        <div ref={graphViewRef}>
          <GraphLayoutButtons setCurrentLayout={setCurrentLayout} currentLayout={currentLayout} />
          <div className={styles.graphContainer} >
            <div id={graphIdString} ref={graphRef} className={`${styles.cytoscapeContainer} cytoscape-container`}>
            </div>
            <div id={graphScrollOverlayId.current} className={`${styles.scrollOverlay} ${scrollOverlayActive && 'active'} scroll-overlay`}>
              <p>To zoom in/out, hold the Z key or use the +/- buttons above.</p>
            </div>
            <div className={styles.graphOverlayItems}>
              <div className={styles.topBar}>
                <div className={styles.edgeInfoWindow} >
                  <p>
                    <span className={styles.edgePrefix}>Edge: </span>
                    <span id={edgeInfoWindowIdString.current} className={styles.edgeInfo}></span>
                  </p>
                </div>
                <div className={styles.graphControls}>
                  <button 
                    onClick={()=>handleZoomByInterval(cy, 0.15, true)}
                    className={`${styles.graphControlButton} ${styles.withIcon}`}
                    >
                    <Plus />
                  </button>
                  <button 
                    onClick={()=>handleZoomByInterval(cy, 0.15, false)}
                    className={`${styles.graphControlButton} ${styles.withIcon}`}
                    >
                    <Minus />
                  </button>
                  <button 
                    onClick={()=>handleResetView(cy)}
                    className={styles.graphControlButton}
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
                    className={styles.graphControlButton}
                    >
                    Deselect All Nodes
                  </button>
                </div>
              </div>
            </div>
            <div id={graphTooltipIdString.current} className='graph-tooltip'>
              <div id='tooltipText' className={`tooltip-text`}></div>
            </div>
            <div 
              id={graphNavigatorContainerId.current} 
              className={styles.graphNavigatorContainer} 
              onMouseEnter={()=>{
                document.body.style.overflow = 'hidden';
                document.body.style.paddingRight = '15px';
              }}
              onMouseLeave={()=>{
                document.body.style.overflow = 'auto';
                document.body.style.paddingRight = '0';
              }}
              >
            </div>
          </div>
        </div>
      </AnimateHeight>
    </div>
  );
}

export default memo(GraphView);