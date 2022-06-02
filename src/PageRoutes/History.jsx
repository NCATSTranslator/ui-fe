import React, {useCallback, useEffect, useState} from "react";
import { pastQueryState, clearHistory, removeItemAtIndex } from "../Redux/historySlice";
import { useSelector, useDispatch } from 'react-redux'
import { Link } from "react-router-dom";
import Modal from "../Components/Modals/Modal";
import Button from "../Components/FormFields/Button";
import {ReactComponent as Close} from '../Icons/Buttons/Close.svg';
import {ReactComponent as Warning} from '../Icons/Alerts/Warning.svg'

const History = () => {

  const dispatch = useDispatch();
  let tempQueryHistory = useSelector(pastQueryState);
  const [queryHistoryState, setQueryHistoryState] = useState(structuredClone(tempQueryHistory).reverse());
  const [modalOpen, setModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  

  const getDifferenceInDays = (date2, date1) => {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;

    // Discard the time and time-zone information.
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    return Math.round(Math.abs((utc2 - utc1) / _MS_PER_DAY));
  }

  const getQueryHistoryOutput = (queryHistory) => {
    let previousTimeName;
    return queryHistory.map((query, i)=> {
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
        <li key={i} className="history-item">
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
                console.log("Removing at " + i);
                dispatch(removeItemAtIndex(i)); 
              }}>
              <Close/>
            </button>
          </div>
        </li>
      )
    })
  }

  return (
    <div className="history-inner">
      <div className="head">
        <h2>History</h2>
        <Button handleClick={()=>setModalOpen(true)}>Clear All</Button>
      </div>
      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)}>
        <h6><Warning/>Warning!</h6>
        <p>This action cannot be undone.</p>
        <div className="button-container">
          <Button 
          isSecondary
            handleClick={()=>{
              dispatch(clearHistory()); 
              setModalOpen(false);
            }}>
            Clear History
          </Button>
          <Button handleClick={()=>setModalOpen(false)}>
            Go Back
          </Button>
        </div>
      </Modal>
        {
          queryHistoryState.length > 0 &&
          <ul className="history-list">
            {getQueryHistoryOutput(queryHistoryState)}
          </ul>
        }
        {
          queryHistoryState.length <= 0 && 
          <div className="no-history">
            <h6>No query history to show!</h6>
            <div className="button-container">
              <Link to="/templates" className="primary button">Templated Queries</Link>
              <Link to="/build" className="primary button">Build Your Own</Link>
            </div>
          </div>
        }
    </div>
  );
}

export default History;