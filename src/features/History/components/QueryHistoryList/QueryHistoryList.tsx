import styles from "./QueryHistoryList.module.scss";
import { useEffect, useState, Dispatch, SetStateAction, useCallback, FormEvent, MouseEvent } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { getDifferenceInDays } from "@/features/Common/utils/utilities";
import { pastQueryState, setHistory } from "@/features/History/slices/historySlice";
import { cloneDeep, debounce } from "lodash";
import { getResultsShareURLPath } from "@/features/Common/utils/web";
import { QueryHistoryItem } from "@/features/History/types/history";
import ShareModal from "@/features/ResultList/components/ShareModal/ShareModal";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import Tooltip from "@/features/Common/components/Tooltip/Tooltip";
import Button from "@/features/Core/components/Button/Button";
import Close from '@/assets/icons/buttons/Close/Close.svg?react';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import RefreshIcon from '@/assets/icons/buttons/Refresh.svg?react';
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import { currentConfig } from "@/features/UserAuth/slices/userSlice";

const QueryHistoryList = ({ loading }: { loading: boolean }) => {
  let previousTimeName: string | undefined;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const config = useSelector(currentConfig);

  const tempQueryHistory = useSelector(pastQueryState) as QueryHistoryItem[];
  // query history stored from oldest -> newest, so we must reverse it to display the most recent first
  const [queryHistoryState, setQueryHistoryState] = useState<QueryHistoryItem[]>(cloneDeep(tempQueryHistory).reverse());
  const [filteredQueryHistoryState, setFilteredQueryHistoryState] = useState<QueryHistoryItem[]>(cloneDeep(queryHistoryState));
  const currentDate = new Date();

  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [exportQueryID, setExportQueryID] = useState<string | null>(null);
  const [exportNodeID, setExportNodeID] = useState<string | null>(null);
  const [exportLabel, setExportLabel] = useState<string | null>(null);
  const [exportTypeID, setExportTypeID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemoveHistoryItem = (i: number) => {
    let temp = cloneDeep(queryHistoryState);
    temp = temp.filter((_, index) => index !== i);
    setQueryHistoryState(temp);
    dispatch(setHistory(temp.slice().reverse()));
  };

  useEffect(() => {
    setFilteredQueryHistoryState(queryHistoryState);
  }, [queryHistoryState]);

  const handleClick = (query: QueryHistoryItem) => {
    const nodeLabel = (!!query.item?.node) ? query.item.node.label : "";
    const nodeID = (!!query.item?.node) ? query.item.node.id : "";
    const typeID = (!!query.item?.type) ?  query.item.type.id : "";
    navigate(`/${getResultsShareURLPath(nodeLabel, nodeID, typeID, '0', query.id, config?.include_hashed_parameters)}`);
  };

  const handleSearch = useCallback((value: string, setIsLoading: Dispatch<SetStateAction<boolean>>, setFilteredQueryHistoryState: Dispatch<SetStateAction<QueryHistoryItem[]>>) => {
    setFilteredQueryHistoryState(
      queryHistoryState.filter((item) => {
        let tempValue = value.toLowerCase();
        let include = false;
        if (
          item.item?.node?.id.toLowerCase().includes(tempValue) ||
          item.item?.node?.label.toLowerCase().includes(tempValue) ||
          item.item?.type?.label.toLowerCase().includes(tempValue)
        )
          include = true;

        if (item.date.toLowerCase().includes(tempValue)) include = true;
        return include;
      })
    );
    setIsLoading(false);
  }, [queryHistoryState]);

  const delayedSearch = useCallback(debounce((value, setIsLoading, setFilteredQueryHistoryState)=>handleSearch(value, setIsLoading, setFilteredQueryHistoryState), 750), [handleSearch]);

  const handleSearchBarItemChange = (value:string) => {
    if(!isLoading)
      setIsLoading(true);
    delayedSearch(value, setIsLoading, setFilteredQueryHistoryState);
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget[0] as HTMLInputElement;
    handleSearch(target.value, setIsLoading, setFilteredQueryHistoryState);
  };
  

  const handleExportClick = (e: MouseEvent, query: QueryHistoryItem) => {
    e.stopPropagation();
    setExportLabel(query?.item?.node?.label ?? null);
    setExportNodeID(query.item?.node?.id ?? null);
    setExportTypeID(query?.item?.type?.id.toString() ?? null);
    setExportQueryID(query.id);
  };

  const handleShareModalClose = () => {
    setExportQueryID(null);
    setShareModalOpen(false);
  };

  useEffect(() => {
    if (exportQueryID === null) return;

    setShareModalOpen(true);
  }, [exportQueryID]);

  return (
    <div className={styles.historyListContainer}>
      <ShareModal
        isOpen={shareModalOpen}
        onClose={handleShareModalClose}
        qid={!!exportQueryID ? exportQueryID : ""}
        label={exportLabel}
        nodeID={exportNodeID}
        typeID={exportTypeID}
      />
      <div className={styles.searchBarContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <TextInput
            placeholder="Search by Subject"
            handleChange={(e)=>handleSearchBarItemChange(e)} 
            className={styles.input}
            iconLeft={<SearchIcon />}
            iconRight={isLoading && <RefreshIcon className={`loadingIcon ${styles.loadingIcon}`} />}
          />
        </form>
      </div>
      <LoadingWrapper loading={loading} contentClassName={`container ${styles.historyContainer}`}>
        <ul className={styles.historyList}>
          {filteredQueryHistoryState.map((query, i) => {
            // hide past queries with old formatting
            if (!query?.item?.node || !query?.item?.type) return null;

            let itemTimestamp = new Date(query.date);
            let timestampDiff = getDifferenceInDays(currentDate, itemTimestamp);
            let timeName = "";
            let showNewTimeName = false;
            // Temporary fix to not display the "treats" predicate in the UI
            let queryLabel = query.item.type.label.replaceAll("treat", "impact");
            switch (timestampDiff) {
              case 0:
                timeName = "Today";
                break;
              case 1:
                timeName = "Yesterday";
                break;
              default:
                timeName = itemTimestamp.toDateString();
                break;
            }
            if (timeName !== previousTimeName) {
              previousTimeName = timeName;
              showNewTimeName = true;
            }
            return (
              <li key={i} className={styles.historyItem}>
                {showNewTimeName && <div className={styles.timeName}>{timeName}</div>}
                <div className={styles.itemContainer}>
                  <span className={styles.query} onClick={() => handleClick(query)}>
                    <div className={styles.left}>
                      <Button
                        className={styles.exportButton}
                        handleClick={(e) => handleExportClick(e, query)}
                        iconOnly
                        dataTooltipId={`query-history-share-button-${query.id}`}
                        variant="secondary"
                      >
                        <ShareIcon />
                      </Button>
                      <Tooltip id={`query-history-share-button-${query.id}`}>
                        <span className={styles.tooltip}>Generate a sharable link for this set of results.</span>
                      </Tooltip>
                    </div>
                    <div className={styles.right}>
                      <div className={styles.top}>
                        {queryLabel && (
                          <span>{queryLabel.replaceAll("a disease?", "").replaceAll("a chemical?", "").replaceAll("a gene?", "")} </span>
                        )}
                        {query.item?.node?.label && <span className={styles.subject}>{query.item.node.label}</span>}?
                      </div>
                      <div className={styles.bottom}>{query.time && <span>{query.time}</span>}</div>
                    </div>
                  </span>
                  <button
                    className={styles.removeItem}
                    onClick={() => handleRemoveHistoryItem(i)}
                  >
                    <Close />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </LoadingWrapper>
    </div>
  );
};

export default QueryHistoryList;
