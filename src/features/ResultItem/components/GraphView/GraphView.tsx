import { useEffect, useRef, useState, useId, useMemo } from 'react';
import cytoscape, { ElementsDefinition } from 'cytoscape';
import klay from 'cytoscape-klay';
import dagre from 'cytoscape-dagre';
import avsdf from 'cytoscape-avsdf';
import cytoscapePopper from 'cytoscape-popper';
import navigator, { Nav } from 'cytoscape-navigator';
import { createPopper } from '@popperjs/core';
import 'cytoscape-navigator/cytoscape.js-navigator.css';
import { useSelector } from 'react-redux';
import { currentPrefs } from '@/features/UserAuth/slices/userSlice';
import { handleResetView, handleDeselectAllNodes, handleZoomByInterval, handleSetupAndUpdateGraphTooltip, handleEdgeMouseOver,
  handleEdgeMouseOut, handleHideTooltip, layoutList } from '@/features/ResultItem/utils/graphFunctions';
import { RenderableGraph, RenderableNode, RenderableEdge } from '@/features/ResultItem/types/graph';
import { Result, ResultSet } from '@/features/ResultList/types/results';
import GraphLayoutButtons from '@/features/ResultItem/components/GraphLayoutButtons/GraphLayoutButtons';
import Button from '@/features/Core/components/Button/Button';
import Plus from '@/assets/icons/buttons/Add/Add.svg?react';
import Minus from '@/assets/icons/buttons/Subtract/Subtract.svg?react';
import styles from './GraphView.module.scss';
import { debounce } from 'lodash';
import { PreferencesContainer } from '@/features/UserAuth/types/user';

cytoscape.use(klay);
cytoscape.use(avsdf);
cytoscape.use(dagre);
cytoscape.use(navigator);
cytoscape.use(cytoscapePopper(createPopper));
cytoscape.warnings(false);

const getInitialLayout = (prefs: PreferencesContainer) => {
  const layoutPref = prefs?.graph_layout?.pref_value || 'vertical';
  switch (layoutPref) {
    case 'horizontal':
      return layoutList.breadthfirst;
    case 'concentric':
      return layoutList.concentric;
    default:
      return layoutList.klay;
  }
};

interface GraphViewProps {
  graph: RenderableGraph;
  result: Result;
  resultSet: ResultSet | null;
  clearSelectedPaths: () => void;
  active: boolean;
  zoomKeyDown: boolean;
}

const GraphView = ({
  graph,
  result,
  resultSet,
  clearSelectedPaths,
  active,
  zoomKeyDown
}: GraphViewProps) => {
  const prefs = useSelector(currentPrefs);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphViewRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const navigatorRef = useRef<Nav | null>(null);
  const [layout, setLayout] = useState(() => getInitialLayout(prefs));
  const [scrollOverlayActive, setScrollOverlayActive] = useState(false);
  const subjectId = useRef(result.subject);
  const objectId = useRef(result.object);
  const zoomKeyDownRef = useRef(zoomKeyDown);

  const id = useId();
  const edgeInfoId = useMemo(()=>`edgeInfoWindow-${id}`, [id]);
  const tooltipId = useMemo(()=>`graphTooltip-${id}`, [id]);
  const navId = useMemo(()=>`cy-nav-container-${id}`, [id]);

  const highlightClass = 'highlight';
  const hideClass = 'hide';
  const excludedClass = 'excluded';

  useEffect(() => {
    if (!active || !containerRef.current || !graph) return;

    const elements: ElementsDefinition = {
      nodes: graph.nodes.map((node: RenderableNode) => ({
        data: { ...node },
        group: 'nodes'
      })),
      edges: graph.edges.map((edge: RenderableEdge) => ({
        data: { ...edge },
        group: 'edges'
      }))
    };

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      layout,
      style: [
        {
          selector: 'node',
          style: {
            'content': 'data(label)',
            'shape': 'round-rectangle',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '206px',
            'padding-top': '8px',
            'padding-right': '8px',
            'padding-bottom': '8px',
            'padding-left': '8px',
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
          selector: `[id = '${objectId.current}'], .isNotSource`,
          style: {
            'background-color': '#2d5492',
            'color': '#fff',
            'border-width': '0px',
          }
        },
        {
          selector: `[id = '${subjectId.current}']`,
          style: {
            'background-color': '#fbaf00',
            'border-width': '0px',
          }
        },
        {
          selector: 'edge',
          style: {
            // label: 'data(label)',
            'curve-style': 'bezier',
            'control-point-step-size': 60,
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#CED0D0',
            'target-arrow-fill': 'filled',
            // 'target-arrow-width': '50px',
            'line-color': '#CED0D0',
            'arrow-scale': 2
          }
        },
        {
          selector: 'edge.highlight',
          style: {
            'line-color': '#242424',
            'opacity': 1.0,
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
            'opacity': 0.3
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
      wheelSensitivity: 0.75,
      minZoom: 0.075,
      maxZoom: 2.5,
      boxSelectionEnabled: false,
      userZoomingEnabled: false,
      data: {
        layoutName: layout.name
      }
    });

    cy.on('mouseover', 'node', ev => {
      ev.target.style('border-width', '2px');
      handleSetupAndUpdateGraphTooltip(ev, tooltipId);
    });
    cy.on('mouseout', 'node', ev => ev.target.style('border-width', '1px'));
    cy.on('mousemove', ev => {
      if (ev.target === cy || !ev.target.isNode()) {
        handleHideTooltip(tooltipId);
      }
    });
    cy.on('pan zoom resize', () => handleHideTooltip(tooltipId));
    cy.on('mouseover', 'edge', ev => handleEdgeMouseOver(ev, edgeInfoId));
    cy.on('mouseout', 'edge', ev => handleEdgeMouseOut(ev, edgeInfoId));
    cy.on('click', ev => {
      if (ev.target === cy) {
        handleDeselectAllNodes(cy, clearSelectedPaths, { highlightClass, hideClass, excludedClass });
      }
    });

    cyRef.current = cy;
    handleResetView(cy);

    const options = {
      container: `#${navId}`,
      viewLiveFramerate: 0,
      thumbnailEventFramerate: 30,
      thumbnailLiveFramerate: 30,
      dblClickDelay: 200,
      removeCustomContainer: false,
      rerenderDelay: 100
    }
    
    // Clean up any existing navigator before creating a new one
    if (navigatorRef.current) {
      navigatorRef.current.destroy();
      navigatorRef.current = null;
    }
    navigatorRef.current = cy.navigator(options);
  }, [graph, layout, active, clearSelectedPaths, navId, tooltipId, edgeInfoId]);

  useEffect(() => {
    const el = graphViewRef.current;
    if (!el) return;

    const hideOverlay = debounce(() => {
      setScrollOverlayActive(false);
    }, 1000);

    const handleWheel = () => {
      if (!zoomKeyDownRef.current) {
        setScrollOverlayActive(true);
        hideOverlay();
      }
    };

    el.addEventListener('wheel', handleWheel);
    return () => {
      el.removeEventListener('wheel', handleWheel);
      hideOverlay.cancel();
      if (navigatorRef.current) {
        navigatorRef.current.destroy();
        navigatorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    zoomKeyDownRef.current = zoomKeyDown;
    if (cyRef.current) {
      cyRef.current.userZoomingEnabled(zoomKeyDown);
    }
  }, [zoomKeyDown]);

  if (!resultSet) return null;

  return (
    <div>
      <div className={styles.header}>
        <p>Click a node once to show paths that include it. Click again to exclude it.</p>
      </div>
      <div ref={graphViewRef}>
        <GraphLayoutButtons currentLayout={layout} setCurrentLayout={setLayout} />
        <div className={styles.graphContainer}>
          <div ref={containerRef} className={`${styles.cytoscapeContainer} cytoscape-container`} />
          <div className={`${styles.scrollOverlay} ${scrollOverlayActive ? 'active' : ''} scroll-overlay`}>
            <p>To zoom, hold Z or use +/- above.</p>
          </div>
          <div className={styles.graphOverlayItems}>
            <div className={styles.topBar}>
              <div className={styles.edgeInfoWindow}>
                <p><span className={styles.edgePrefix}>Edge: </span><span id={edgeInfoId} className={styles.edgeInfo}></span></p>
              </div>
              <div className={styles.graphControls}>
                <Button handleClick={() => handleZoomByInterval(cyRef.current, 0.15, true)} className={`${styles.graphControlButton} ${styles.withIcon}`} iconOnly>
                  <Plus />
                </Button>
                <Button handleClick={() => handleZoomByInterval(cyRef.current, 0.15, false)} className={`${styles.graphControlButton} ${styles.withIcon}`} iconOnly>
                  <Minus />
                </Button>
                <Button handleClick={() => handleResetView(cyRef.current)} className={styles.graphControlButton}>
                  Reset View
                </Button>
                <Button handleClick={() => handleDeselectAllNodes(cyRef.current, clearSelectedPaths, { highlightClass, hideClass, excludedClass })} className={styles.graphControlButton}>
                  Deselect All
                </Button>
              </div>
            </div>
          </div>
          <div id={tooltipId} className='graph-tooltip'>
            <div id='tooltipText' className='tooltip-text'></div>
          </div>
          <div id={navId} className={styles.graphNavigatorContainer} onMouseEnter={() => {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '15px';
          }} onMouseLeave={() => {
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0';
          }} />
        </div>
      </div>
    </div>
  );
};

export default GraphView;
