import { FC } from "react";
import { Filter } from "@/features/ResultFiltering/types/filters";
import ResultsFilter from "@/features/ResultFiltering/components/ResultsFilter/ResultsFilter";

interface FiltersPanelProps {
  activeFilters: Filter[];
  availableFilters: {[key: string]: Filter};
  isPathfinder?: boolean;
  onFilter: (arg0: Filter) => void;
  onClearAll: () => void;
}

const FiltersPanel: FC<FiltersPanelProps> = ({
  activeFilters,
  availableFilters,
  isPathfinder = false,
  onFilter,
  onClearAll
}) => {
  return (
    <ResultsFilter
      activeFilters={activeFilters}
      onFilter={onFilter}
      onClearAll={onClearAll}
      availableFilters={availableFilters}
      isPathfinder={isPathfinder}
    />
  );
};

export default FiltersPanel;