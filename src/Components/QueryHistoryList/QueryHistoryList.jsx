import styles from "./QueryHistoryList.module.scss";
import {useEffect, useState} from "react";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { getDifferenceInDays } from "../../Utilities/utilities";
import { pastQueryState, setHistory } from "../../Redux/historySlice";
import ShareModal from '../Modals/ShareModal';
import TextInput from "../FormFields/TextInput";
import Tooltip from "../Tooltip/Tooltip";
import Close from '../../Icons/Buttons/Close/Close.svg?react';
import SearchIcon from '../../Icons/Buttons/Search.svg?react';
import ShareIcon from '../../Icons/Buttons/Export.svg?react';
import { cloneDeep } from "lodash";
import { getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";

const QueryHistoryList = () => {

  let previousTimeName;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  let tempQueryHistory = useSelector(pastQueryState);
  // query history stored from oldest -> newest, so we must reverse it to display the most recent first
  const [queryHistoryState, setQueryHistoryState] = useState(cloneDeep(tempQueryHistory).reverse());
  const [filteredQueryHistoryState, setFilteredQueryHistoryState] = useState(cloneDeep(queryHistoryState))
  const currentDate = new Date();

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [exportQueryID, setExportQueryID] = useState(null);
  const [exportLabel, setExportLabel] = useState(null);
  const [exportTypeID, setExportTypeID] = useState(null);

  const handleRemoveHistoryItem = (i) => {
    let temp = cloneDeep(queryHistoryState);
    temp = temp.filter((element, index) => index !== i);
    setQueryHistoryState(temp);
    dispatch(setHistory(temp.slice().reverse()));
  }

  useEffect(() => {
    setFilteredQueryHistoryState(queryHistoryState)
  }, [queryHistoryState]);

  const handleClick = (query) => {
    navigate(`/${getResultsShareURLPath(query.item?.node?.label, query.item?.node?.id, query.item?.type?.id, '0', query.id)}`);
  }

  const handleSearch = (value) => {
    setFilteredQueryHistoryState(queryHistoryState.filter((item) => {
      let tempValue = value.toLowerCase();
      let include = false;
      if(item.item?.node?.id.toLowerCase().includes(tempValue) 
        || item.item?.node?.label.toLowerCase().includes(tempValue) 
        || item.item?.type?.label.toLowerCase().includes(tempValue)
      )
        include = true;

      if(item.date.toLowerCase().includes(tempValue))
        include = true;
      return include;
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(e.target[0].value);
  }

  const handleExportClick = (e, query) => {
    e.stopPropagation();
    setExportLabel(query?.item?.node?.label);
    setExportTypeID(query?.item?.type?.id);
    setExportQueryID(query.id);
  }
    
  const handleShareModalClose = () => {
    setExportQueryID(null)
    setShareModalOpen(false);
  }

  useEffect(() => {
    if(exportQueryID === null)
      return
    
    setShareModalOpen(true);
    
  }, [exportQueryID]);
  
  return (
    <div className={styles.historyListContainer}>
      <ShareModal 
        isOpen={shareModalOpen} 
        onClose={()=>{
          handleShareModalClose();
        }} 
        qid={exportQueryID}
        label={exportLabel}
        typeID={exportTypeID}
      />
      <div className={styles.searchBarContainer}>
        <form onSubmit={(e)=>{handleSubmit(e)}} className={styles.form}>
          <TextInput 
            placeholder="Search by Subject" 
            handleChange={(e)=>handleSearch(e)} 
            className={styles.input}
            size=""
            icon={<SearchIcon/>}
          />
          <button type="submit" size="" >
            <span>Search</span>
          </button>
        </form>
      </div>
      <ul className={styles.historyList}> 
        {
          filteredQueryHistoryState.map((query, i)=> {
            // hide past queries with old formatting
            if(!query?.item?.node || !query?.item?.type)
              return null;

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
            if(timeName !== previousTimeName) {
              previousTimeName = timeName;
              showNewTimeName = true;
            }
            return (
              <li key={i} className={styles.historyItem} >
                {
                  showNewTimeName &&
                  <div className={styles.timeName}>{timeName}</div>            
                }
                <div className={styles.itemContainer}>
                  <span className={styles.query} onClick={() => handleClick(query)}>
                    <div className={styles.left}>
                      <button 
                        className={styles.exportButton} onClick={(e)=>{handleExportClick(e, query)}}
                        data-tooltip-id={`query-history-share-button-${query.id}`}
                        >
                          <ShareIcon/>
                        </button>
                      <Tooltip id={`query-history-share-button-${query.id}`}>
                        <span className={styles.tooltip}>Generate a sharable link for this set of results.</span>
                      </Tooltip>
                    </div>
                    <div className={styles.right}>
                      <div className={styles.top}>
                        {
                          query.item?.type?.label &&
                          <span>{query.item.type.label} </span>
                        }
                        {
                          query.item?.node?.label &&
                          <span className={styles.subject}>{query.item.node.label}</span>
                        }
                      </div>
                      <div className={styles.bottom}>
                        {
                          query.time &&
                          <span>{query.time}</span>
                        }
                      </div>
                    </div>
                  </span>
                  <button 
                    className={styles.removeItem}
                    onClick={(e)=> {
                      handleRemoveHistoryItem(i)
                    }}>
                    <Close/>
                  </button>
                </div>
              </li>
            )
          })
        }
      </ul>
    </div>
  )
  
}

export default QueryHistoryList;