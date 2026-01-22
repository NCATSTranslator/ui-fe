import { FC } from "react";
import { ResultSet, Result } from "@/features/ResultList/types/results.d";
import { SaveGroup } from "@/features/UserAuth/utils/userApi";
import ResultDownloadPanelInner from "@/features/ResultDownload/components/ResultDownloadPanelInner/ResultDownloadPanelInner";

interface ResultDownloadPanelProps {
  resultSet: ResultSet;
  filteredResults: Result[];
  allResults: Result[];
  userSaves: SaveGroup | null;
  isPathfinder?: boolean;
  queryTitle?: string;
}

const ResultDownloadPanel: FC<ResultDownloadPanelProps> = ({
  resultSet,
  filteredResults,
  allResults,
  userSaves,
  isPathfinder = false,
  queryTitle,
}) => {
  return (
    <ResultDownloadPanelInner
      resultSet={resultSet}
      filteredResults={filteredResults}
      allResults={allResults}
      userSaves={userSaves}
      isPathfinder={isPathfinder}
      queryTitle={queryTitle}
    />
  );
};

export default ResultDownloadPanel;
