import styles from "./QueryHistoryList.module.scss";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { getDifferenceInDays } from "../../Utilities/utilities";
import { pastQueryState, setHistory } from "../../Redux/historySlice";
import { cloneDeep, debounce } from "lodash";
import { getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";
import { QueryHistoryItem } from "../../Types/global";
import ShareModal from '../Modals/ShareModal';
import TextInput from "../Core/TextInput";
import Tooltip from "../Tooltip/Tooltip";
import Button from "../Core/Button";
import Close from '../../Icons/Buttons/Close/Close.svg?react';
import SearchIcon from '../../Icons/Buttons/Search.svg?react';
import ShareIcon from '../../Icons/Buttons/Link.svg?react';
import RefreshIcon from '../../Icons/Buttons/Refresh.svg?react';

const QueryHistoryList = () => {
  let previousTimeName: string | undefined;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const tempQueryHistory = useSelector(pastQueryState) as QueryHistoryItem[];
  // query history stored from oldest -> newest, so we must reverse it to display the most recent first
  const [queryHistoryState, setQueryHistoryState] = useState<QueryHistoryItem[]>(cloneDeep(tempQueryHistory).reverse());
  const [filteredQueryHistoryState, setFilteredQueryHistoryState] = useState<QueryHistoryItem[]>(cloneDeep(queryHistoryState));
  const currentDate = new Date();

  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [exportQueryID, setExportQueryID] = useState<string | null>(null);
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
    navigate(`/${getResultsShareURLPath(query.item?.node?.label, query.item?.node?.id, query.item?.type?.id, '0', query.id)}`);
  };

  const handleSearch = debounce((value: string) => {
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
  }, 500);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget[0] as HTMLInputElement;
    handleSearch(target.value);
  };
  

  const handleExportClick = (e: React.MouseEvent, query: QueryHistoryItem) => {
    e.stopPropagation();
    setExportLabel(query?.item?.node?.label ?? null);
    setExportTypeID(query?.item?.type?.id ?? null);
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
        typeID={exportTypeID}
      />
      <div className={styles.searchBarContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <TextInput
            placeholder="Search by Subject"
            handleChange={(e) => {setIsLoading(true); handleSearch(e);}}
            className={styles.input}
            iconLeft={<SearchIcon />}
            iconRight={isLoading && <RefreshIcon className={`loadingIcon ${styles.loadingIcon}`} />}
          />
        </form>
      </div>
      <div className={`container ${styles.historyContainer}`}>
        <ul className={styles.historyList}>
          {filteredQueryHistoryState.map((query, i) => {
            // hide past queries with old formatting
            if (!query?.item?.node || !query?.item?.type) return null;

            let itemTimestamp = new Date(query.date);
            let timestampDiff = getDifferenceInDays(currentDate, itemTimestamp);
            let timeName = "";
            let showNewTimeName = false;
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
                        isSecondary
                      >
                        <ShareIcon />
                      </Button>
                      <Tooltip id={`query-history-share-button-${query.id}`}>
                        <span className={styles.tooltip}>Generate a sharable link for this set of results.</span>
                      </Tooltip>
                    </div>
                    <div className={styles.right}>
                      <div className={styles.top}>
                        {query.item?.type?.label && (
                          <span>{query.item.type.label.replaceAll("a disease?", "").replaceAll("a chemical?", "").replaceAll("a gene?", "")} </span>
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
      </div>
    </div>
  );
};

export default QueryHistoryList;