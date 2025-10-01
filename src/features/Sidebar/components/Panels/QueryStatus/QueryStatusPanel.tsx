import { FC } from "react";
import { ARAStatusResponse } from "@/features/ResultList/types/results.d";

interface QueryStatusPanelProps {
  arsStatus: ARAStatusResponse | null;
}

const QueryStatusPanel: FC<QueryStatusPanelProps> = ({ arsStatus }) => {
  console.log(arsStatus);
  return (
    <div>
      <p>Translator results are loaded incrementally due to the complexity of our reasoning systems. As more results become available, you'll be prompted to refresh the page to view them.</p>
      <p>You can run a new query or explore the results, bookmarks, and notes from your past queries in Projects while you wait for results to load.</p>
    </div>
  );
};

export default QueryStatusPanel;