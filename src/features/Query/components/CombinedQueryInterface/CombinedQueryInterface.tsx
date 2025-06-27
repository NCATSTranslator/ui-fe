import { useState, FC, Dispatch, SetStateAction } from "react";
import { Result } from "@/features/ResultList/types/results.d";
import Tabs from "@/features/Common/components/Tabs/Tabs";
import Tab from "@/features/Common/components/Tabs/Tab";
import Query from "@/features/Query/components/Query/Query";
import QueryPathfinder from "@/features/Query/components/QueryPathfinder/QueryPathfinder";
import styles from './CombinedQueryInterface.module.scss';
import BetaTag from "@/features/Common/components/BetaTag/BetaTag";
import { useSelector } from "react-redux";
import { currentConfig } from "@/features/User-Auth/slices/userSlice";

interface CombinedQueryInterfaceProps {
  isResults?: boolean;
  loading?: boolean;
  results?: Result[];
  handleResultMatchClick?: Function;
  setShareModalFunction?: Dispatch<SetStateAction<boolean>>;
  pk?: string;
  // Query-specific props
  initPresetTypeObject?: any;
  initNodeLabelParam?: string | null;
  initNodeIdParam?: string | null;
  nodeDescription?: string | null;
}

const CombinedQueryInterface: FC<CombinedQueryInterfaceProps> = ({
  isResults = false,
  loading = false,
  results = [],
  handleResultMatchClick = () => {},
  setShareModalFunction = () => {},
  pk = "",
  // Query-specific props
  initPresetTypeObject = null,
  initNodeLabelParam = null,
  initNodeIdParam = null,
  nodeDescription = null,
}) => {
  const [activeTab, setActiveTab] = useState<string>("Query");
  const config = useSelector(currentConfig);
  const isPathfinderEnabled = config?.include_pathfinder;

  const handleTabSelection = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <div className={styles.combinedQueryInterface}>
      <Tabs
        isOpen={true}
        handleTabSelection={handleTabSelection}
        defaultActiveTab="Smart Query"
        className={styles.tabsContainer}
        tabListClassName={styles.tabList}
      >
        <Tab heading="Smart Query" className={styles.queryTab}>
          <Query
            isResults={isResults}
            loading={loading}
            initPresetTypeObject={initPresetTypeObject}
            initNodeLabelParam={initNodeLabelParam}
            initNodeIdParam={initNodeIdParam}
            nodeDescription={nodeDescription}
            setShareModalFunction={setShareModalFunction}
            results={results}
            handleResultMatchClick={handleResultMatchClick}
            pk={pk}
          />
        </Tab>
        { isPathfinderEnabled 
        ? 
          <Tab 
            heading="Pathfinder Query"
            headingOverride={<BetaTag heading="Pathfinder Query" />}
            className={styles.pathfinderTab}>
            <QueryPathfinder
              isResults={isResults}
              loading={loading}
              results={results}
              handleResultMatchClick={handleResultMatchClick}
              setShareModalFunction={setShareModalFunction}
              pk={pk}
            />
          </Tab>
        : null}
      </Tabs>
    </div>
  );
};

export default CombinedQueryInterface;