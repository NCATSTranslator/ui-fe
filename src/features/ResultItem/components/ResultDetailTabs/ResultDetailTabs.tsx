import { Dispatch, FC, SetStateAction, lazy, Suspense } from 'react';
import PathView from '@/features/ResultItem/components/PathView/PathView';
import LoadingBar from '@/features/Core/components/LoadingBar/LoadingBar';
import Tabs from '@/features/Core/components/Tabs/Tabs';
import Tab from '@/features/Core/components/Tabs/Tab';
import { resultToGraphData } from '@/features/ResultGraphView/utils/graphFunctions';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { PathFilterState, Result, ResultSet } from '@/features/ResultList/types/results';
import styles from './ResultDetailTabs.module.scss';

const GraphView = lazy(() => import('@/features/ResultGraphView/components/GraphView/GraphView'));
const PATHS_TAB_TOOLTIP_ID = 'paths-tab-tooltip';

interface ResultDetailTabsProps {
  activeEntityFilters: string[];
  activeFilters: Filter[];
  graph: ReturnType<typeof resultToGraphData>;
  graphActive: boolean;
  pathCount: number;
  pathFilterState: PathFilterState;
  pk: string;
  result: Result;
  resultSet: ResultSet | undefined;
  setGraphActive: Dispatch<SetStateAction<boolean>>;
  setShowHiddenPaths: Dispatch<SetStateAction<boolean>>;
  showHiddenPaths: boolean;
}

const ResultDetailTabs: FC<ResultDetailTabsProps> = ({
  activeEntityFilters,
  activeFilters,
  graph,
  graphActive,
  pathCount,
  pathFilterState,
  pk,
  result,
  resultSet,
  setGraphActive,
  setShowHiddenPaths,
  showHiddenPaths,
}) => (
  <>
    <Tooltip id={PATHS_TAB_TOOLTIP_ID}>
      <span>Paths are composed of stepwise links for each result's key concepts. Select a path to explore publications and additional resources supporting each relationship.</span>
    </Tooltip>
    <Tabs
      isOpen
      className={styles.tabs}
      fadeClassName={styles.tabFade}
      handleTabSelection={(heading) => setGraphActive(heading === 'Graph')}
    >
      <Tab
        heading="Paths"
        headingOverride={`${pathCount} Paths`}
        tooltipIcon={<InfoIcon className={styles.infoIcon} />}
        dataTooltipId={PATHS_TAB_TOOLTIP_ID}
        className={styles.pathsTab}
      >
        <PathView
          active
          activeEntityFilters={activeEntityFilters}
          activeFilters={activeFilters}
          isEven={false}
          pathArray={result.paths}
          pathFilterState={pathFilterState}
          pk={pk}
          pathsWrapperClassName={styles.pathsScroll}
          resultId={result.id}
          setShowHiddenPaths={setShowHiddenPaths}
          showHiddenPaths={showHiddenPaths}
        />
      </Tab>
      <Tab heading="Graph" className={styles.graphTab}>
        <Suspense fallback={<LoadingBar useIcon reducedPadding />}>
          <GraphView
            graph={graph}
            active={graphActive}
            resultSet={resultSet}
          />
        </Suspense>
      </Tab>
    </Tabs>
  </>
);

export default ResultDetailTabs;
