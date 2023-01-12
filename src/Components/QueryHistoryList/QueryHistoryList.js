import React, {useEffect, useState} from "react";
import styles from "./QueryHistoryList.module.scss";
import { getDifferenceInDays } from "../../Utilities/utilities";
import { pastQueryState, removeItemAtIndex } from "../../Redux/historySlice";
import { setCurrentQuery } from "../../Redux/querySlice";
import { useSelector, useDispatch } from 'react-redux';
import ShareModal from '../../Components/Modals/ShareModal';
import TextInput from "../FormFields/TextInput";
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';
import {ReactComponent as SearchIcon} from '../../Icons/Buttons/Search.svg';
import {ReactComponent as Export} from '../../Icons/export.svg';
import { useNavigate } from "react-router-dom";

const QueryHistoryList = () => {

  let previousTimeName;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  let tempQueryHistory = useSelector(pastQueryState);
  // query history stored from oldest -> newest, so we must reverse it to display the most recent first
  const [queryHistoryState, setQueryHistoryState] = useState(global.structuredClone(tempQueryHistory).reverse());
  const [filteredQueryHistoryState, setFilteredQueryHistoryState] = useState(global.structuredClone(queryHistoryState))
  const currentDate = new Date();

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [exportQueryID, setExportQueryID] = useState(null);

  const handleRemoveHistoryItem = (i) => {
    let temp = global.structuredClone(queryHistoryState);
    temp.splice(i, 1);
    setQueryHistoryState(temp);
    dispatch(removeItemAtIndex(i)); 
  }

  const handleClick = (query) => {
    dispatch(setCurrentQuery(query.items));
    navigate(`/results?q=${query.id}`);
  }

  const handleSearch = (value) => {
    queryHistoryState.forEach(element => {
    });
    setFilteredQueryHistoryState(queryHistoryState.filter((item) => {
      let include = false;
      item.items.forEach((element) => {
        if(element.name.toLowerCase().includes(value.toLowerCase())) {
          include = true;
        }
      })
      if(item.date.toLowerCase().includes(value.toLowerCase()))
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
      />
      <div className={styles.searchBarContainer}>
        <form onSubmit={(e)=>{handleSubmit(e)}} className={styles.form}>
          <TextInput 
            placeholder="Search by Subject" 
            handleChange={(e)=>handleSearch(e)} 
            className={styles.input}
            size=""
            icon={<SearchIcon/>}
            // value={value}
          />
          <button type="submit" size="" >
            <span>Search</span>
          </button>
        </form>
      </div>
      <ul className={styles.historyList}> 
        {
          filteredQueryHistoryState.map((query, i)=> {
            // early return to accommodate old formatting, remove later 
            if(query.items !== undefined)
              return;

            console.log(query);
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
                      <button className={styles.exportButton} onClick={(e)=>{handleExportClick(e, query)}}><Export/></button>
                    </div>
                    <div className={styles.right}>
                      <div className={styles.top}>
                        <span>{query.item.type.label} </span>
                        <span className={styles.subject}>{query.item.node.label}</span>
                        {/* {
                          query.items && 
                          query.items.map((item, j) => {
                            let output = (item.value) ? item.value : item.name;
                            return (
                              <span key={j} className={item.type}>{output} </span>)
                            })
                        } */}
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