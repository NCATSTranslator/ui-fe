import { FC } from "react";
import { Filter } from "@/features/ResultFiltering/types/filters";
import ResultsFilter from "@/features/ResultFiltering/components/ResultsFilter/ResultsFilter";

interface FiltersPanelProps {
  activeFilters: Filter[];
  availableFilters: {[key: string]: Filter};
  isPathfinder?: boolean;
  onFilter: (arg0: Filter) => void;
  onSetFilters: (filters: Filter[]) => void;
}

const FiltersPanel: FC<FiltersPanelProps> = ({
  activeFilters,
  availableFilters,
  isPathfinder = false,
  onFilter,
  onSetFilters,
}) => {
  return (
    <ResultsFilter
      activeFilters={activeFilters}
      onFilter={onFilter}
      onSetFilters={onSetFilters}
      availableFilters={availableFilters}
      isPathfinder={isPathfinder}
    />
  );
};

export default FiltersPanel;