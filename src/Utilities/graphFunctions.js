import ReactDOM from 'react-dom';
import cytoscape from 'cytoscape';
import { debounce, cloneDeep } from 'lodash';
import { getIcon } from './utilities';
import {ReactComponent as ExternalLink} from '../Icons/external-link.svg';

export const layoutList = {
  klay: {
    name: 'klay', spacingFactor: 1.3, klay:{direction: 'RIGHT', edgeSpacingFactor: .1}, 
    ready: (ev)=>{ 
      if(ev.target?.options?.eles?.length < 10) { 
        ev.cy.zoom({level:1.5}); 
        ev.cy.center(); 
      }
    }
  },
  breadthfirst: {
    name: 'breadthfirst', spacingFactor: 1.1, avoidOverlap: true, directed: true
  },
  dagre: {
    name: 'dagre', spacingFactor: 1.1
  },
  circle: {
    name: 'circle'
  },
  concentric: {
    name: 'concentric'
  },
}

export const resultToCytoscape = (result, summary) => {
  const makeNode = (n, nodes) =>
  {
    const name = nodes[n].names[0];
    const type = nodes[n].types[0];
    const provenance = nodes[n].provenance[0];
    console.log(n, nodes[n]);
    return {
      data: {
        id: n,
        label: name,
        type: type,
        provenance: provenance,
        isTargetCount: 0,
        isSourceCount: 0,
        isTargetEdges: [],
        isSourceEdges: []
      }
    };
  }

  const makeNodes = (ns, nodes) => 
  {
    return [...ns].map((n) => { return makeNode(n, nodes); });
  }

  const makeEdge = (eid, src, srcLbl, tgt, tgtLbl, pred) =>
  {
    return {
      data: {
        id: eid,
        source: src,
        sourceLabel: srcLbl,
        target: tgt,
        targetLabel: tgtLbl,
        label: pred
      }
    };
  }

  const makeEdges = (es, edges, nodes) =>
  {
    return [...es].map((e) =>
      {
        return makeEdge(e, edges[e].subject, nodes[edges[e].subject].names[0], edges[e].object, 
          nodes[edges[e].object].names[0], edges[e].predicate);
      });
  }

  const ps = result.paths;
  const ns = new Set();
  const es = new Set();
  ps.forEach((p) =>
  {
    summary.paths[p].subgraph.forEach((elem, i) =>
      {
        if (i % 2 === 0)
        {
          ns.add(elem);
        }
        else
        {
          es.add(elem);
        }
      });
  });

  const c = {
    nodes: makeNodes(ns, summary.nodes),
    edges: makeEdges(es, summary.edges, summary.nodes)
  };

  for(const node of c.nodes) {
    for(const edge of c.edges) {
      // calculate source counts for each node
      if(node.data.id === edge.data.source) {
        node.data.isSourceCount++;
        node.data.isSourceEdges.push(edge);
      }
      // calculate target counts for each node
      if(node.data.id === edge.data.target) {
        node.data.isTargetCount++;
        node.data.isTargetEdges.push(edge);
      }
    }
  }

  return c;
}

/**
 * Finds all paths in a graph from a start node to any node in a set of end nodes.
 * The paths are restricted to a maximum length of 5 nodes.
 *
 * @param {string} start - The starting node identifier.
 * @param {Set} ends - A Set of end node identifiers.
 * @param {Object} graph - The graph object, expected to have an 'edges' property, 
 *                         which is an array of objects each having 'data' property 
 *                         that includes 'source' and 'target' properties.
 * @returns {Set} A set of all paths from the start node to any of the nodes in the 'ends' set. 
 *                  Each path is represented as an array of node identifiers.
 * @example
 * const paths = findPaths('node1', new Set(['node3', 'node4']), graph);
 */
export const findPaths = (start, ends, graph) => {

  let paths = {};
  let stack = [[start, [start]]];

  while (stack.length > 0) {
    let [node, path] = stack.pop();

    if (ends.has(node)) {
      if (!paths[node]) paths[node] = [];
      paths[node].push(path);
    }
    // limit path length to 5 nodes
    if(path.length < 5) {
      for (let edge of graph.edges) {
        if (edge.data.source === node && !path.includes(edge.data.target)) {
          stack.push([edge.data.target, [...path, edge.data.target]]);
        }
      }
    }
  }

  // flattens the arrays in the paths object (which are associated with each end node) into a single array
  return new Set(Object.values(paths).flat());
}

/**
* Resets the cytoscape viewport to the default view.
* @param {Object} cy - A cytoscape instance.
* @returns {void}
*/
export const handleResetView = (cy) => {
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
export const handleDeselectAllNodes = (cy, selNodes, excNodes, clearSelectedPaths, classes) => {
  cy.elements().removeClass([classes.highlightClass, classes.hideClass, classes.excludedClass]);
  selNodes.current.clear();
  excNodes.current.clear();
  clearSelectedPaths();
}

export const handleZoomByInterval = (cy, interval = 0.25, direction = true) => {
  console.log('current zoom level: ', cy.zoom());
  const currentZoomLevel = cy.zoom();
  if(direction)
    cy.zoom(currentZoomLevel + interval);
  else 
    cy.zoom(currentZoomLevel - interval);
}

const handleHideTooltip = (graphTooltipIdString) => {
  let tooltip = document.getElementById(graphTooltipIdString);
  tooltip.classList.remove('visible');
}

const handleSetupAndUpdateGraphTooltip = debounce((ev, cy, graphTooltipIdString) => {
  let elem = ev.target;
  let elemId = elem?.data()?.id;
  let type = elem?.data()?.type;
  let icon = getIcon(type);
  let url = elem?.data()?.provenance;

  console.log(elem.data());

  let popper = elem.popper({
    content: () => {
      let tooltipElement = document.getElementById(graphTooltipIdString);
      let tooltipTextElement = tooltipElement.getElementsByClassName('tooltip-text')[0];
      const tooltipMarkup = 
        <span>
          {icon}
          <p class='id'>{elemId} ({type})</p>
          {url && 
            <a href={url} target="_blank" rel='noreferrer' className='url'>
              <ExternalLink/>
              <span>{url}</span>
            </a>
          }
        </span>;

      ReactDOM.render(tooltipMarkup, tooltipTextElement);

      tooltipElement.classList.add('visible');
  
      return tooltipElement;
    },
    popper:{placement: 'top'}
  });
  
  let update = () => {
    popper.update();
  };
  
  elem.on('position', update);
  // cy.on('pan zoom resize', update);
}, 300, []);

/**
* Initializes a Cytoscape instance with the specified data and options.
* @param {Object} result - An object representing the result to be displayed in the graph.
* @param {Object} summary - An object containing the raw results information from the BE.
* @param {Object} dataObj - An object containing various options and data used to configure and interact with the Cytoscape instance.
* @returns {void}
*/
export const initCytoscapeInstance = (dataObj) => {
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
          'padding': '8px',
          'color': '#000',
          'background-color': '#fff',
          'border-color': '#000',
          'border-width': '2px',
          'text-wrap': 'ellipsis',
          'text-max-width': '190px',
          'font-weight': 'bold'
        }
      },
      {
        selector: `[id = '${dataObj.objectId}'], .isNotSource`,
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
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#000',
          'line-color': '#CED0D0',
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
  cy.bind('vclick', 'edge', (ev)=>console.log(ev.target.data()));

  cy.on('mouseover', 'node', (ev) => handleSetupAndUpdateGraphTooltip(ev, cy, dataObj.graphTooltipIdString));
  cy.on('mousemove', (ev)=>{
    // if we're on the background, or not on a node, hide the tooltip 
    if(ev.target === cy || !ev.target.isNode()) 
      handleHideTooltip(dataObj.graphTooltipIdString)
  });
  cy.on('pan zoom resize', ()=>{
    handleHideTooltip(dataObj.graphTooltipIdString)
  });

  cy.on('mouseover', 'edge', (ev) => {
    let elem = ev.target;
    let elemLabel = elem?.data()?.label;
    let sourceLabel = elem?.data()?.sourceLabel;
    let targetLabel = elem?.data()?.targetLabel;

    elem.style({'line-color': '#7b7c7c'});
    
    let edgeInfoWindow = document.getElementById(dataObj.edgeInfoWindowIdString);
    let edgeInfoMarkup = <><span>{sourceLabel}</span> <span className='edge-label'>{elemLabel}</span> <span>{targetLabel}</span></>;
    ReactDOM.render(edgeInfoMarkup, edgeInfoWindow)
  });
  cy.on('mouseout', 'edge', (ev) => ev.target.style({'line-color': '#CED0D0' }))

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

  // add class for nodes that are targets but aren't the main result's target 
  for(const node of cy.elements('node')) {
    if(node.data('isSourceCount') === 0) {
      node.addClass('isNotSource')
    }
  }

  // Set bounds of zoom
  cy.maxZoom(2.5);
  cy.minZoom(.1);


  if(dataObj.cyNav !== null) {
    dataObj.cyNav.destroy();
  }

  var defaults = {
    container: `#${dataObj.graphNavigatorContainerId}`, // string | false | undefined. Supported strings: an element id selector (like "#someId"), or a className selector (like ".someClassName"). Otherwise an element will be created by the library.
    viewLiveFramerate: 0, // set false to update graph pan only on drag end; set 0 to do it instantly; set a number (frames per second) to update not more than N times per second
    thumbnailEventFramerate: 30, // max thumbnail's updates per second triggered by graph updates
    thumbnailLiveFramerate: false, // max thumbnail's updates per second. Set false to disable
    dblClickDelay: 200, // milliseconds
    removeCustomContainer: false, // destroy the container specified by user on plugin destroy
    rerenderDelay: 100, // ms to throttle rerender updates to the panzoom for performance
  };

  let nav = cy.navigator( defaults ); // init navigator instance

  return {
    cy: cy,
    nav: nav
  };
}

/**
* Given a graph object, returns a filtered graph object with only one edge per source/target relationship  
* @param {Object} graph - An object with properties containing two arrays, nodes and edges.
* @returns {Object} - A new graph object with only one edge per source/target relationship.
*/
export const getGraphWithoutExtraneousPaths = (graph) => {
  let newGraph = {nodes: cloneDeep(graph.nodes), edges:[]};

  for(const edge of graph.edges) {
    let addEdge = true;
    for(const newEdge of newGraph.edges) {
      if(newEdge.data.source === edge.data.source && newEdge.data.target === edge.data.target) {
        addEdge = false;
      }
    }
    if(addEdge) {
      newGraph.edges.push(cloneDeep(edge));
    }
  }
  return newGraph;
}