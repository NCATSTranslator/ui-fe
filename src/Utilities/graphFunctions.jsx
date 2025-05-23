import ReactDOM from 'react-dom';
import cytoscape from 'cytoscape';
import { debounce, cloneDeep } from 'lodash';
import { capitalizeFirstLetter, hasSupport } from './utilities';
import ExternalLink from '../Icons/Buttons/External Link.svg?react';

export const layoutList = {
  klay: {
    label: 'vertical',
    name: 'klay', spacingFactor: 1.3, klay:{direction: 'RIGHT', edgeSpacingFactor: .1},
    ready: (ev)=>{
      if(ev.target?.options?.eles?.length < 10) {
        ev.cy.zoom({level:1.5});
        ev.cy.center();
      }
    }
  },
  breadthfirst: {
    label: 'horizontal',
    name: 'breadthfirst', spacingFactor: 1.1, avoidOverlap: true, directed: true
  },
  concentric: {
    label: 'concentric',
    name: 'concentric'
  },
}

export const resultToCytoscape = (result, summary) => {
  const makeNode = (n, nodes) =>
  {
    if(!nodes[n]) {
      return {
        data: {
          id: n,
          label: "unknown node",
          type: "",
          provenance: null,
          isTargetCount: 0,
          isSourceCount: 0,
          isTargetEdges: [],
          isSourceEdges: []
        }
      };
    }
    const name = nodes[n].names[0];
    const type = nodes[n].types[0];
    const provenance = nodes[n].provenance[0];
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

  const makeEdge = (eid, edge, nodes) =>
  {
    let isInferred = hasSupport(edge) ? true : false;
    let src = edge.subject;
    let tgt = edge.object;
    let pred = edge.predicate;
    let srcLbl = (!!nodes[src]) ? nodes[src].names[0] : "unknown node";
    let tgtLbl = (!!nodes[tgt]) ? nodes[tgt].names[0] : "unknown node";
    return {
      data: {
        id: eid,
        source: src,
        sourceLabel: srcLbl,
        target: tgt,
        targetLabel: tgtLbl,
        label: pred,
        inferred: isInferred
      }
    };
  }

  const makeEdges = (es, edges, nodes) =>
  {
    let edgeIDList = [...es];
    return edgeIDList.map((e) =>
      {
        return makeEdge(e, edges[e], nodes);
      });
  }

  const distributeEntitiesInPath = (pathID, pathsArray, edgesArray,
      nodeCollection, edgeCollection, supportStack) => {
    if (pathsArray[pathID] !== undefined) {
      supportStack.push(pathID);
      pathsArray[pathID].subgraph.forEach((elemID, i) => {
        if (i % 2 === 0) {
          nodeCollection.add(elemID);
        } else {
          edgeCollection.add(elemID);
          const edge = edgesArray[elemID];
          if (hasSupport(edge)) {
            const validSupport = edge.support.filter(p => !supportStack.includes(p));
            for(const supportPathID of validSupport) {
              distributeEntitiesInPath(supportPathID, pathsArray, edgesArray,
                  nodeCollection, edgeCollection, supportStack);
            }
          }
        }
      });
    } else {
      console.log("path missing from list: ", pathsArray, ". pathID: ", pathID);
    }
  }

  const ps = result.paths;
  const ns = new Set();
  const es = new Set();
  for(const pathID of ps) {
    distributeEntitiesInPath(pathID, summary.paths, summary.edges, ns, es, []);
  }

  const c = {
    nodes: makeNodes(ns, summary.nodes),
    edges: makeEdges(es, summary.edges, summary.nodes)
  };
  for(const edge of c.edges) {
    if(edge === undefined || edge === null)
      console.log(edge);
    if(edge.data.inferred === undefined || edge.data.inferred === null)
      console.log(edge);
  }

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
 * Finds all node sequences in a graph from a start node to any node in a set of end nodes.
 *
 * @param {string} start - The starting node identifier.
 * @param {Set} ends - A Set of end node identifiers.
 * @param {Object} graph - The graph object, expected to have an 'edges' property,
 *                         which is an array of objects each having 'data' property
 *                         that includes 'source' and 'target' properties.
 * @returns {Set<string[]>} A set of all node sequences from the start node to any of the nodes in the 'ends' set.
 *                  Each node sequence is represented as an array of node identifiers.
 * @example
 * const nodeSequences = findNodeSequences('node1', new Set(['node3', 'node4']), graph);
 */
export const findNodeSequences = (start, ends, graph) => {

  let nodeSequences = {};
  let stack = [[start, [start]]];

  while (stack.length > 0) {
    let [node, path] = stack.pop();

    if (ends.has(node)) {
      if (!nodeSequences[node]) nodeSequences[node] = [];
      nodeSequences[node].push(path);
    }
    for (let edge of graph.edges) {
      if (edge.data.source === node && !path.includes(edge.data.target)) {
        stack.push([edge.data.target, [...path, edge.data.target]]);
      }
    }
  }
  // flattens the arrays in the paths object (which are associated with each end node) into a single array
  return new Set(Object.values(nodeSequences).flat());
}

/**
* Resets the cytoscape viewport to the default view.
* @param {Object} cy - A cytoscape instance.
* @returns {void}
*/
export const handleResetView = (cy) => {
  if(!cy)
    return;

  return cy.fit(cy.elements(), 75);
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

export const handleZoomByInterval = (cyGraph, interval = 0.25, direction = true) => {
  const currentZoomLevel = cyGraph.zoom();
  if(direction)
    cyGraph.zoom(currentZoomLevel + interval);
  else
    cyGraph.zoom(currentZoomLevel - interval);
}

const handleHideTooltip = (graphTooltipIdString) => {
  let tooltip = document.getElementById(graphTooltipIdString);
  if(tooltip !== null)
    tooltip.classList.remove('visible');
}

const handleEdgeMouseOver = (ev, edgeInfoWindowIdString) => {
  let elem = ev.target;
  let elemLabel = elem?.data()?.label;
  let sourceLabel = elem?.data()?.sourceLabel;
  let targetLabel = elem?.data()?.targetLabel;

  elem.addClass('hover-highlight');

  let edgeInfoWindow = document.getElementById(edgeInfoWindowIdString);
  let edgeInfoMarkup = <><span>{sourceLabel}</span> <span className='edge-label'>{elemLabel}</span> <span>{targetLabel}</span></>;
  ReactDOM.render(edgeInfoMarkup, edgeInfoWindow);
}

const handleEdgeMouseOut = (ev, edgeInfoWindowIdString) => {
  ev.target.removeClass('hover-highlight')
  let edgeInfoWindow = document.getElementById(edgeInfoWindowIdString);
  let edgeInfoMarkup = <></>;
  ReactDOM.render(edgeInfoMarkup, edgeInfoWindow);
}

const handleSetupAndUpdateGraphTooltip = debounce((ev, graphTooltipIdString) => {
  let elem = ev.target;
  let elemLabel = elem?.data()?.label;
  let type = capitalizeFirstLetter(elem?.data()?.type.replace('biolink:', ''));
  let url = elem?.data()?.provenance;

  let popper = elem.popper({
    content: () => {
      let tooltipElement = document.getElementById(graphTooltipIdString);
      let tooltipTextElement = tooltipElement.getElementsByClassName('tooltip-text')[0];
      const tooltipMarkup =
        <span className='tooltip-markup'>
          <p class='label'>{elemLabel} <span className='type'>({type})</span></p>
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
  let cyGraph = cytoscape({
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
          'border-width': '1px',
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
          'curve-style': 'straight',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#CED0D0',
          'target-arrow-fill': 'filled',
          'target-arrow-width': '50px',
          'line-color': '#CED0D0',
          'arrow-scale': '2'
        }
      },
      {
        selector: 'edge.highlight',
        style: {
          'line-color': '#242424',
          'opacity': '1.0',
          'target-arrow-color': '#242424',
        }
      },
      {
        selector: 'edge.hover-highlight',
        style: {
          'line-color': '#7b7c7c'
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
      {
        selector: 'edge[?inferred]',
        style: {
          'line-style': 'dashed',
          'line-dash-pattern': [20, 5]
        }
      },
    ],
    wheelSensitivity: .75,
    minZoom: .075,
    maxZoom: 2.5,
    boxSelectionEnabled: false,
    data: {
      layoutName: dataObj.layout.name
    }
  });

  cyGraph.on('vclick', 'node', (ev, formattedResults)=>dataObj.handleNodeClick(ev, formattedResults, dataObj.graph));
  cyGraph.on('vclick', 'edge', (ev)=>console.log(ev.target.data()));

  cyGraph.on('mouseover', 'node', (ev) => {
    ev.target.style('border-width', '2px' );
    handleSetupAndUpdateGraphTooltip(ev, dataObj.graphTooltipIdString);
  });
  cyGraph.on('mouseout', 'node', (ev) => ev.target.style('border-width', '1px' ));
  cyGraph.on('mousemove', (ev) => {
    // if we're on the background, or not on a node, hide the tooltip
    if(ev.target === cyGraph || !ev.target.isNode())
      handleHideTooltip(dataObj.graphTooltipIdString)
  });
  cyGraph.on('pan zoom resize', ()=>{
    handleHideTooltip(dataObj.graphTooltipIdString)
  });

  cyGraph.on('mouseover', 'edge', (ev) => handleEdgeMouseOver(ev, dataObj.edgeInfoWindowIdString));
  cyGraph.on('mouseout', 'edge', (ev) => handleEdgeMouseOut(ev, dataObj.edgeInfoWindowIdString));

  // when background is clicked, remove highlight and hide classes from all elements
  cyGraph.on('click', (ev) => {
    if(ev.target === cyGraph) {
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
  for(const node of cyGraph.elements('node')) {
    if(node.data('isSourceCount') === 0) {
      node.addClass('isNotSource')
    }
  }

  // init view
  handleResetView(cyGraph);

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

  let nav = cyGraph.navigator( defaults ); // init navigator instance

  return {
    cy: cyGraph,
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
