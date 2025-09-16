import { commonQueryClientOptions } from "@/features/Common/utils/utilities";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSidebarRegistration } from "@/features/Sidebar/hooks/sidebarHooks";
import ResultList from "@/features/ResultList/components/ResultList/ResultList";
import FilterIcon from '@/assets/icons/navigation/Filter.svg?react';
import ResultFiltersPanel from "@/features/Sidebar/components/Panels/ResultFilters/ResultFiltersPanel";

const queryClient = new QueryClient(commonQueryClientOptions);

const Results = () => {

  useSidebarRegistration({
    ariaLabel: "Filters",
    icon: <FilterIcon />,
    id: 'filters',
    label: "Filters",
    panelComponent: <ResultFiltersPanel />,
    tooltipText: "Filters",
    // autoOpen: true // Uncomment to auto-open when landing on Results
  });

  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <ResultList />
      </QueryClientProvider>
    </div>
  );
}

export default Results;