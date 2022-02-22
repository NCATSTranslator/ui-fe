import React, {useState} from "react";
import { pastQueryState, clearHistory, removeItemAtIndex } from "../Redux/store";
import { useSelector, useDispatch } from 'react-redux'
import { Link } from "react-router-dom";
import Modal from "../Components/Modals/Modal";
import Button from "../Components/FormFields/Button";
import {ReactComponent as Close} from '../Icons/Buttons/Close.svg';
import {ReactComponent as Warning} from '../Icons/Alerts/Warning.svg'

const History = () => {

  const queryHistoryState = useSelector(pastQueryState);
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);

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
            {queryHistoryState.map((query, i)=> {
              return (
                <li key={i} className="history-item">
                  <span className="query">
                    {query.map((item, j) => {
                      let output = (item.value) ? item.value : item.name;
                      return (
                        <span key={j}>{output} </span>)
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
                </li>
              )
            })}
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