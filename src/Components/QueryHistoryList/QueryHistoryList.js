import React, {useState} from "react";
import styles from "./QueryHistoryList.module.scss";
import { getDifferenceInDays } from "../../Utilities/utilities";
import { pastQueryState, removeItemAtIndex } from "../../Redux/historySlice";
import { setCurrentQuery } from "../../Redux/querySlice";
import { useSelector, useDispatch } from 'react-redux';
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

  const handleRemoveHistoryItem = (i) => {
    let temp = global.structuredClone(queryHistoryState);
    temp.splice(i, 1);
    setQueryHistoryState(temp);
    dispatch(removeItemAtIndex(i)); 
  }

  const handleClick = (query) => {
    dispatch(setCurrentQuery(query.items));
    navigate('/build?results');
  }

  const handleSearch = (value) => {
    console.log(value);
    queryHistoryState.forEach(element => {
      console.log(element)
    });
    setFilteredQueryHistoryState(queryHistoryState.filter((item) => {
      let include = false;
      item.items.forEach((element) => {
        if(element.name.toLowerCase().includes(value.toLowerCase())) {
          console.log(`including ${element.name}`)
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
  
  return (
    <div className={styles.historyListContainer}>
      <div className={styles.searchBarContainer}>
        <form onSubmit={(e)=>{handleSubmit(e)}} className={styles.form}>
          <TextInput 
            placeholder="Search by Date or Subject" 
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
                      <button className={styles.exportButton} onClick={(e)=>{e.stopPropagation(); console.log('export'); }}><Export/></button>
                    </div>
                    <div className={styles.right}>
                      <div className={styles.top}>
                        {
                          query.items.map((item, j) => {
                            let output = (item.value) ? item.value : item.name;
                            return (
                              <span key={j} className={item.type}>{output} </span>)
                            })
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