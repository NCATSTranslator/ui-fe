import React, {useState} from "react";
import { pastQueryState, clearHistory } from "../Redux/historySlice";
import { useSelector, useDispatch } from 'react-redux'
import { Link } from "react-router-dom";
import Modal from "../Components/Modals/Modal";
import Button from "../Components/FormFields/Button";
import {ReactComponent as Warning} from '../Icons/Alerts/Warning.svg'
import QueryHistoryList from "../Components/QueryHistoryList/QueryHistoryList";

const History = () => {

  const dispatch = useDispatch();
  let queryHistoryState = useSelector(pastQueryState);
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
          <QueryHistoryList />
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