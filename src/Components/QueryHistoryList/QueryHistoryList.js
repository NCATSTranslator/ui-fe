import { getDifferenceInDays } from "../../Utilities/utilities";
import React, {useState} from "react";
import { pastQueryState, removeItemAtIndex } from "../../Redux/historySlice";
import { useSelector, useDispatch } from 'react-redux'
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';

const QueryHistoryList = () => {

  let previousTimeName;
  const dispatch = useDispatch();
  let tempQueryHistory = useSelector(pastQueryState);
  // query history stored from oldest -> newest, so we must reverse it to display the most recent first
  const [queryHistoryState, setQueryHistoryState] = useState(structuredClone(tempQueryHistory).reverse());
  const currentDate = new Date();

  const handleRemoveHistoryItem = (i) => {
    let temp = structuredClone(queryHistoryState);
    temp.splice(i, 1);
    setQueryHistoryState(temp);
    dispatch(removeItemAtIndex(i)); 
  }

  const handleClick = (query) => {
    console.log(query);
  }
  
  return (
    <ul className="history-list"> 
      {
        queryHistoryState.map((query, i)=> {
          let itemTimestamp = new Date(query.time);
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
            <li key={i} className="history-item" onClick={() => handleClick(query)}>
              {
                showNewTimeName &&
                <div className="time-name">{timeName}</div>            
              }
              <div className="item-container">
                <span className="query">
                  {query.items.map((item, j) => {
                    let output = (item.value) ? item.value : item.name;
                    return (
                      <span key={j} className={item.type}>{output} </span>)
                    })
                  }
                </span>
                <button 
                  className="remove-item"
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
  )
  
}

export default QueryHistoryList;