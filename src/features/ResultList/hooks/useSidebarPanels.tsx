import { useState, useEffect, useMemo, useRef, Dispatch, SetStateAction } from "react";
import { useSidebarRegistration, useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { useResultsCompleteToast } from "@/features/ResultList/hooks/resultListHooks";
import { getQueryStatusIndicatorStatus } from "@/features/Projects/utils/utilities";
import { ResultSet, Result, ARAStatusResponse, ResultListLoadingData } from "@/features/ResultList/types/results.d";
import { Filter } from "@/features/ResultFiltering/types/filters";
import { SaveGroup } from "@/features/UserAuth/utils/userApi";
import FilterIcon from '@/assets/icons/navigation/Filter.svg?react';
import DownloadIcon from '@/assets/icons/buttons/Export.svg?react';
import QueryStatusPanel from "@/features/Sidebar/components/Panels/QueryStatusPanel/QueryStatusPanel";
import FiltersPanel from "@/features/Sidebar/components/Panels/FiltersPanel/FiltersPanel";
import ResultDownloadPanel from "@/features/Sidebar/components/Panels/ResultDownloadPanel/ResultDownloadPanel";
import BetaTag from "@/features/Core/components/BetaTag/BetaTag";
import StatusSidebarIcon from "@/features/ResultList/components/StatusSidebarIcon/StatusSidebarIcon";
import IconBadge from "@/features/Sidebar/components/IconBadge/IconBadge";
import Button from "@/features/Core/components/Button/Button";

interface UseSidebarPanelsArgs {
  styles: Record<string, string>;
  // Status panel
  arsStatus: ARAStatusResponse | null;
  resultStatus: "error" | "running" | "success" | "unknown";
  formattedResults: Result[];
  isFetchingARAStatus: boolean | null;
  isFetchingResults: boolean;
  hasFreshResults: boolean;
  isError: boolean;
  handleResultsRefresh: () => void;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
  // Filters panel
  activeFilters: Filter[];
  handleFilter: (filter: Filter) => void;
  handleSetFilters: (filters: Filter[]) => void;
  handleClearAllFilters: () => void;
  availableFilters: { [key: string]: Filter };
  isPathfinder: boolean;
  currentQueryID: string | null;
  // Download panel
  resultSet: ResultSet | null;
  userSaves: SaveGroup | null;
  queryTitle: string;
}

const useSidebarPanels = ({
  styles,
  arsStatus,
  resultStatus,
  formattedResults,
  isFetchingARAStatus,
  isFetchingResults,
  hasFreshResults,
  isError,
  handleResultsRefresh,
  setIsLoading,
  isLoading,
  activeFilters,
  handleFilter,
  handleSetFilters,
  handleClearAllFilters,
  availableFilters,
  isPathfinder,
  resultSet,
  userSaves,
  queryTitle,
  currentQueryID,
}: UseSidebarPanelsArgs): void => {
  const { togglePanel, openPanel, activePanelId } = useSidebar();

  // Auto-open the filters panel at the moment results first appear for a query.
  // Storing the query ID (rather than a bool) re-arms the auto-open when a new
  // query loads. We mark the query handled as soon as results land — so if
  // another panel is open at that moment we skip the auto-open and never retry.
  const autoOpenedForQuery = useRef<string | null>(null);
  const availableFilterCount = Object.keys(availableFilters).length;
  useEffect(() => {
    if (!currentQueryID || autoOpenedForQuery.current === currentQueryID)
      return;
    if (formattedResults.length > 0 && availableFilterCount > 0) {
      if (activePanelId === 'none')
        openPanel('filters');
      autoOpenedForQuery.current = currentQueryID;
    }
  }, [currentQueryID, formattedResults.length, availableFilterCount, activePanelId, openPanel]);

  // Toast state — only used by sidebar status icon
  const [showQueryStatusToast, setShowQueryStatusToast] = useState(true);

  useEffect(() => {
    setShowQueryStatusToast(hasFreshResults && activePanelId !== 'queryStatus');
  }, [hasFreshResults, activePanelId]);

  // Data for the loading button in the Query Status panel
  const loadingButtonData: ResultListLoadingData = useMemo(() => ({
    handleResultsRefresh,
    isFetchingARAStatus,
    isFetchingResults,
    showDisclaimer: true,
    hasFreshResults,
    isError,
    setIsActive: setIsLoading
  }), [handleResultsRefresh, isFetchingARAStatus, isFetchingResults, isError, setIsLoading, hasFreshResults]);

  const { status: statusIndicatorStatus } = getQueryStatusIndicatorStatus(
    arsStatus,
    isFetchingARAStatus || false,
    hasFreshResults,
    isFetchingResults,
    resultStatus,
    formattedResults.length || 0
  );

  useResultsCompleteToast(arsStatus, isFetchingResults);

  const handleQueryStatusClick = () => {
    togglePanel('queryStatus');
    setShowQueryStatusToast(false);
  };

  // Register the status sidebar item
  useSidebarRegistration({
    ariaLabel: "Query Status",
    className: styles.statusSidebarIcon,
    onClick: handleQueryStatusClick,
    icon: () => <StatusSidebarIcon data={loadingButtonData} arsStatus={arsStatus} status={statusIndicatorStatus} hasFreshResults={hasFreshResults} showQueryStatusToast={showQueryStatusToast} setShowQueryStatusToast={setShowQueryStatusToast} />,
    id: 'queryStatus',
    title: "Status",
    panelComponent: () => <QueryStatusPanel arsStatus={arsStatus} data={loadingButtonData} resultStatus={resultStatus} resultCount={formattedResults.length || 0} />,
    tooltipText: "",
    dependencies: [arsStatus, loadingButtonData, resultStatus, formattedResults.length, showQueryStatusToast, hasFreshResults, statusIndicatorStatus, setShowQueryStatusToast]
  });

  // Register the filters sidebar item
  useSidebarRegistration({
    ariaLabel: "Filters",
    buttonComponent: () => (
      activeFilters.length > 0 ? (
        <Button smallFont variant="textOnly" handleClick={handleClearAllFilters} className={styles.clearAllButton}>Clear All</Button>
      ) : (
        null
      )
    ),
    icon: (
      <IconBadge count={activeFilters.length}>
        <FilterIcon />
      </IconBadge>
    ),
    id: 'filters',
    title: "Filters",
    panelComponent: () => (
      <FiltersPanel
        activeFilters={activeFilters}
        onFilter={handleFilter}
        onSetFilters={handleSetFilters}
        availableFilters={availableFilters}
        isPathfinder={isPathfinder}
      />
    ),
    reduceSpacing: true,
    tooltipText: "Filters",
    dependencies: [
      activeFilters,
      availableFilters,
      isPathfinder,
      handleFilter,
      handleSetFilters,
      handleClearAllFilters,
    ],
  });

  // Register the download sidebar item
  useSidebarRegistration({
    ariaLabel: "Download Results",
    disabled: isLoading || formattedResults.length === 0,
    icon: <DownloadIcon className={styles.downloadIcon} />,
    id: 'download',
    title: <BetaTag heading="Download" />,
    panelComponent: () => (
      <ResultDownloadPanel
        resultSet={resultSet as ResultSet}
        filteredResults={formattedResults}
        allResults={resultSet?.data?.results || []}
        userSaves={userSaves}
        isPathfinder={isPathfinder}
        queryTitle={queryTitle}
      />
    ),
    tooltipText: "Download Results",
    dependencies: [resultSet, formattedResults, userSaves, isLoading, isPathfinder, queryTitle]
  });
};

export default useSidebarPanels;
