import React, {useState} from "react";
import { queryState, clearHistory } from "../Redux/store";
import { useSelector, useDispatch } from 'react-redux'
import Modal from "../Components/Modals/Modal";
import Button from "../Components/FormFields/Button";
import {ReactComponent as Close} from '../Icons/Buttons/Close.svg';

const History = () => {

  const queryHistoryState = useSelector(queryState);
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div className="header">
        <h2>History</h2>
        <Button handleClick={()=>setModalOpen(true)}>Clear All</Button>
      </div>
      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)}>
        <h6>Are you sure you want to delete your query history?</h6>
        <p>*This action cannot be undone.</p>
        <div className="button-container">
          <Button 
            handleClick={()=>{
              dispatch(clearHistory()); 
              setModalOpen(false);
            }}>
            Yes
          </Button>
          <Button handleClick={()=>setModalOpen(false)}>
            No
          </Button>
        </div>
      </Modal>
      <ul className="history-list">
        {
          queryHistoryState.map((query, i)=> {
            return (
              <li key={i} className="history-item">
                <span className="query">
                  {query.map((item, j) => {
                    return (
                      <span key={j}>{item.name} </span>)
                    })
                  }
                </span>
                <button 
                  className="remove-item"
                  onClick={()=> {

                  }}>
                  <Close/>
                </button>
              </li>
            )
          })
        }
      </ul>
    </div>
  );
}

export default History;