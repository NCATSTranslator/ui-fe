import React, {useState} from "react";
import Modal from "./Modal";
import Button from '../FormFields/Button';
import TextInput from "../FormFields/TextInput";
import Checkbox from "../FormFields/Checkbox";
import Select from "../FormFields/Select";

const EvidenceModal = ({children, isOpen, onClose, currentEvidence, results}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;

  return (
    <Modal isOpen={modalIsOpen} onClose={onClose} className="evidence-modal">
      <h5>Evidence</h5>
        <div className="table-head">
          <div className="head date">Date</div>
          <div className="head journal">Journal</div>
          <div className="head title">Title</div>
          <div className="head summary">Summary</div>
          <div className="head edge">Edge Supported</div>
          <div className="head pmid">PMID</div>
        </div>
        <div className="table-body">
          {
            currentEvidence.length > 0 &&
            currentEvidence.map((item, i)=> {
              console.log(item);
              console.log(results.static_node);
              return (
                <div className="evidence-item" key={i}>
                  <span className="pubdate">
                    {item.dates && item.dates[0] }          
                  </span>
                  <span className="journal">
                    {item.source && item.source }          
                  </span>
                  <span className="title">
                    {item.title && item.url && <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> }
                  </span>
                  <span className="summary">
                    {!item.summary && "No summary available."}
                    {item.summary && item.summary}
                    {item.url && <a href={item.url} target="_blank" rel="noreferrer">Read More</a>}          
                  </span>
                  <span className="edge">
                    {item.pubdate && item.pubdate }          
                  </span>
                  <span className="pmid">
                    {item.pmid && item.pmid }          
                  </span>
                </div>
              )
            })
          } 
          {
            currentEvidence.length <= 0 &&
            <p>No evidence is currently available for this item.</p>
          }
        </div>
    </Modal>
  );
}


export default EvidenceModal;

