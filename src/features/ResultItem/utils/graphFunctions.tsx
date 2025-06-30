import { render } from 'react-dom';
import { Core, EventObject } from 'cytoscape';
import { debounce } from 'lodash';
import { capitalizeFirstLetter, hasSupport } from '@/features/Common/utils/utilities';
import ExternalLink from '@/assets/icons/Buttons/External Link.svg?react';
import { Result, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import { GraphLayoutList, RenderableGraph, RenderableNode, RenderableEdge } from '@/features/ResultItem/types/graph.d';

export const layoutList: GraphLayoutList = {
  klay: {
    label: 'vertical',
    name: 'klay',
    spacingFactor: 1.3,
    klay: { direction: 'RIGHT', edgeSpacingFactor: 0.1 },
    ready: (ev: any) => {
      if (ev.target?.options?.eles?.length < 10) {
        ev.cy.zoom({ level: 1.5 });
        ev.cy.center();
      }
    },
    edgeDistances: 'node-position',
  },
  breadthfirst: {
    label: 'horizontal',
    name: 'breadthfirst',
    spacingFactor: 1.1,
    avoidOverlap: true,
    directed: true,
    edgeDistances: 'node-position',
  },
  concentric: {
    label: 'concentric',
    name: 'concentric'
  }
};

export const resultToCytoscape = (
  result: Result,
  summary: { nodes: Record<string, ResultNode>, edges: Record<string, ResultEdge>, paths: Record<string, { subgraph: string[] }> }
): RenderableGraph => {
  const distributeEntitiesInPath = (
    pathID: string,
    pathsArray: typeof summary.paths,
    edgesArray: typeof summary.edges,
    nodeCollection: Set<string>,
    edgeCollection: Set<string>,
    supportStack: string[]
  ) => {
    const path = pathsArray[pathID];
    if (path) {
      supportStack.push(pathID);
      path.subgraph.forEach((elemID, i) => {
        if (i % 2 === 0) nodeCollection.add(elemID);
        else {
          edgeCollection.add(elemID);
          const edge = edgesArray[elemID];
          if (hasSupport(edge)) {
            const validSupport = edge.support.filter(p => { 
              const pid = typeof p === "string" ? p : p.id;
              return !!pid && !supportStack.includes(pid);
            });
            for (const supportPathID of validSupport) {
              const id = typeof supportPathID === "string" ? supportPathID : supportPathID.id;
              if(!id) {
                console.warn('unable to add support path to graph, id is missing.');
                continue;
              }
              distributeEntitiesInPath(id, pathsArray, edgesArray, nodeCollection, edgeCollection, supportStack);
            }
          }
        }
      });
    } else {
      console.warn("Missing pathID:", pathID);
    }
  };

  const ns = new Set<string>();
  const es = new Set<string>();
  for (const pathID of result.paths) {
    const pid = typeof pathID === "string" ? pathID : pathID.id;
    if(!!pid)
      distributeEntitiesInPath(pid, summary.paths, summary.edges, ns, es, []);
  }

  const nodeMap: Record<string, RenderableNode> = {};
  for (const n of ns) {
    const node = summary.nodes[n];
    nodeMap[n] = convertResultNodeToRenderable(node);
  }

  const edges: RenderableEdge[] = [];
  for (const eid of es) {
    const edge = convertResultEdgeToRenderable(summary.edges[eid], summary.nodes);
    edges.push(edge);
  }

  // attach edges to nodes
  for (const edge of edges) {
    const src = nodeMap[edge.source];
    const tgt = nodeMap[edge.target];
    if (src) {
      src.isSourceCount++;
      src.isSourceEdges.push(edge);
    }
    if (tgt) {
      tgt.isTargetCount++;
      tgt.isTargetEdges.push(edge);
    }
  }

  return {
    nodes: Object.values(nodeMap),
    edges
  };
};

// export const findNodeSequences = (
//   start: string,
//   ends: Set<string>,
//   graph: RenderableGraph
// ): Set<string[]> => {
//   const nodeSequences: Record<string, string[][]> = {};
//   const stack: [string, string[]][] = [[start, [start]]];

//   while (stack.length > 0) {
//     const [node, path] = stack.pop()!;
//     if (ends.has(node)) {
//       if (!nodeSequences[node]) nodeSequences[node] = [];
//       nodeSequences[node].push(path);
//     }

//     for (const edge of graph.edges) {
//       if (edge.source === node && !path.includes(edge.target)) {
//         stack.push([edge.target, [...path, edge.target]]);
//       }
//     }
//   }

//   return new Set(Object.values(nodeSequences).flat());
// };

export const handleResetView = (cyGraph: Core | null): void => {
  if (!cyGraph) return;
  cyGraph.fit(cyGraph.elements(), 75);
};

export const handleDeselectAllNodes = (
  cyGraph: Core | null,
  clearSelectedPaths: () => void,
  classes: { highlightClass: string; hideClass: string; excludedClass: string },
  selNodes?: React.MutableRefObject<Set<string>>,
  excNodes?: React.MutableRefObject<Set<string>>
): void => {
  if(!cyGraph) {
    console.warn('unable to deselect nodes, no cytoscape graph provided.');
    return;
  }
  cyGraph.elements().removeClass([
    classes.highlightClass,
    classes.hideClass,
    classes.excludedClass
  ]);
  if(!!selNodes)
    selNodes.current.clear();
  if(!!excNodes)
    excNodes.current.clear();
  clearSelectedPaths();
};

export const handleZoomByInterval = (
  cyGraph: Core | null,
  interval = 0.25,
  direction = true
): void => {
  if(!cyGraph) {
    console.warn('unable to zoom graph, no cytoscape graph provided.');
    return;
  }
  const currentZoomLevel = cyGraph.zoom();
  cyGraph.zoom(direction ? currentZoomLevel + interval : currentZoomLevel - interval);
};

export const handleHideTooltip = (graphTooltipIdString: string): void => {
  const tooltip = document.getElementById(graphTooltipIdString);
  if (tooltip) tooltip.classList.remove('visible');
};

export const handleEdgeMouseOver = (
  ev: EventObject,
  edgeInfoWindowIdString: string
): void => {
  const elem = ev.target;
  const { label, sourceLabel, targetLabel } = elem.data();

  elem.addClass('hover-highlight');
  const edgeInfoWindow = document.getElementById(edgeInfoWindowIdString);
  const edgeInfoMarkup = (
    <>
      <span>{sourceLabel}</span>{' '}
      <span className="edge-label">{label}</span>{' '}
      <span>{targetLabel}</span>
    </>
  );
  if (edgeInfoWindow) {
    render(edgeInfoMarkup, edgeInfoWindow);
  }
};

export const handleEdgeMouseOut = (
  ev: EventObject,
  edgeInfoWindowIdString: string
): void => {
  ev.target.removeClass('hover-highlight');
  const edgeInfoWindow = document.getElementById(edgeInfoWindowIdString);
  if (edgeInfoWindow) render(<></>, edgeInfoWindow);
};

export const handleSetupAndUpdateGraphTooltip = debounce(
  (ev: EventObject, graphTooltipIdString: string): void => {
    const elem = ev.target;
    const label = elem?.data()?.label;
    const type = capitalizeFirstLetter(
      elem?.data()?.type?.replace('biolink:', '') ?? ''
    );
    const url = elem?.data()?.provenance;

    const popper = elem.popper({
      content: () => {
        const tooltipElement = document.getElementById(graphTooltipIdString)!;
        const tooltipTextElement = tooltipElement.getElementsByClassName(
          'tooltip-text'
        )[0];
        const tooltipMarkup = (
          <span className="tooltip-markup">
            <p className="label">
              {label} <span className="type">({type})</span>
            </p>
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="url">
                <ExternalLink />
                <span>{url}</span>
              </a>
            )}
          </span>
        );
        render(tooltipMarkup, tooltipTextElement);
        tooltipElement.classList.add('visible');
        return tooltipElement;
      },
      popper: { placement: 'top' }
    });

    elem.on('position', () => popper.update());
  },
  300
);

// export const initCytoscapeInstance = (dataObj: GraphDataObject) => {
//   const cyGraph = cytoscape({
//     container: dataObj.graphRef.current,
//     elements: dataObj.graph,
//     layout: dataObj.layout,
//     wheelSensitivity: 0.75,
//     minZoom: 0.075,
//     maxZoom: 2.5,
//     boxSelectionEnabled: false,
//     data: {
//       layoutName: dataObj.layout.name
//     }
//   });

//   // cyGraph.on('vclick', 'node', (ev: any) =>
//   //   dataObj.handleNodeClick(ev, dataObj.formattedResults, dataObj.graph)
//   // );
//   cyGraph.on('vclick', 'edge', (ev: any) => console.log(ev.target.data()));

//   cyGraph.on('mouseover', 'node', (ev: any) => {
//     ev.target.style('border-width', '2px');
//     handleSetupAndUpdateGraphTooltip(ev, dataObj.graphTooltipIdString);
//   });
//   cyGraph.on('mouseout', 'node', (ev: any) =>
//     ev.target.style('border-width', '1px')
//   );
//   cyGraph.on('mousemove', (ev: any) => {
//     if (ev.target === cyGraph || !ev.target.isNode()) {
//       handleHideTooltip(dataObj.graphTooltipIdString);
//     }
//   });
//   cyGraph.on('pan zoom resize', () =>
//     handleHideTooltip(dataObj.graphTooltipIdString)
//   );

//   cyGraph.on('mouseover', 'edge', (ev: any) =>
//     handleEdgeMouseOver(ev, dataObj.edgeInfoWindowIdString)
//   );
//   cyGraph.on('mouseout', 'edge', (ev: any) =>
//     handleEdgeMouseOut(ev, dataObj.edgeInfoWindowIdString)
//   );

//   cyGraph.on('click', (ev: any) => {
//     if (ev.target === cyGraph) {
//       handleDeselectAllNodes(
//         ev.cy,
//         dataObj.clearSelectedPaths,
//         {
//           highlightClass: dataObj.highlightClass,
//           hideClass: dataObj.hideClass,
//           excludedClass: dataObj.excludedClass
//         }
//       );
//     }
//   });

//   for (const node of cyGraph.elements('node')) {
//     if (node.data('isSourceCount') === 0) {
//       node.addClass('isNotSource');
//     }
//   }

//   handleResetView(cyGraph);

//   // if (dataObj.cyNav !== null) {
//   //   dataObj.cyNav.destroy();
//   // }

//   const nav = cyGraph.navigator({
//     container: `#${dataObj.graphNavigatorContainerId}`,
//     viewLiveFramerate: 0,
//     dblClickDelay: 200,
//     removeCustomContainer: false,
//     rerenderDelay: 100
//   });

//   return {
//     cy: cyGraph,
//     nav
//   };
// };

// export const getGraphWithoutExtraneousPaths = (graph: RenderableGraph): RenderableGraph => {
//   const newGraph: RenderableGraph = {
//     nodes: cloneDeep(graph.nodes),
//     edges: []
//   };

//   for (const edge of graph.edges) {
//     const duplicate = newGraph.edges.some(
//       e => e.source === edge.source && e.target === edge.target
//     );
//     if (!duplicate) {
//       newGraph.edges.push(cloneDeep(edge));
//     }
//   }

//   return newGraph;
// };

export function convertResultNodeToRenderable(n: ResultNode): RenderableNode {
  return {
    id: n.id,
    label: n.names[0] ?? "unknown node",
    type: n.types[0] ?? "unknown",
    provenance: n.provenance ?? null,
    isTargetCount: 0,
    isSourceCount: 0,
    isTargetEdges: [],
    isSourceEdges: []
  };
}

export function convertResultEdgeToRenderable(
  e: ResultEdge,
  nodes: Record<string, ResultNode>
): RenderableEdge {
  const sourceLabel = nodes[e.subject]?.names[0] ?? "unknown node";
  const targetLabel = nodes[e.object]?.names[0] ?? "unknown node";
  return {
    id: e.id,
    source: e.subject,
    target: e.object,
    sourceLabel,
    targetLabel,
    label: e.predicate,
    inferred: Array.isArray(e.support) && e.support.length > 0
  };
}