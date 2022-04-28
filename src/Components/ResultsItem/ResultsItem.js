import React, {useState} from 'react';
import { getIcon, capitalizeFirstLetter } from '../../Utilities/utilities';
import Checkbox from "../FormFields/Checkbox";
import {ReactComponent as CheckIcon } from "../../Icons/Buttons/Circle Checkmark.svg"


const ResultsItem = ({key, item, staticNode, allSelected, handleSelected, activateEvidence }) => {

  // let icon = getIcon(item.type);
  let icon = getIcon('chemical');

  let evidenceCount = 
    (
      item.edge !== undefined &&
      item.edge.evidence !== undefined 
    ) 
    ? item.edge.evidence.length
    : 0;
    
  let fdaLevel = (item.subject.fda_info ) 
    ? item.subject.fda_info.max_level 
    : 'N/A';

  var dateString = item.edge.last_publication_date;
  var date = null;
  if(dateString !== null && dateString.includes('/')) {
    var splitDate = dateString.split('/');
    var month = splitDate[1] - 1; //Javascript months are 0-11
    date = (splitDate.length === 2) 
      ? new Date('1/' + dateString) 
      : new Date(splitDate[2], month, splitDate[0]);
  }
  
  let lastPubYear = (date !== null)
    ? date.getFullYear()
    : date;

  let predicate = (item.edge.predicate)
    ? item.edge.predicate.replace("biolink:", '') + ' ' + staticNode.names[0]
    : '';


  return (
    <div key={key} className="result">
      <div className="checkbox-container result-sub">
        <Checkbox checked={allSelected} handleClick={()=>handleSelected(item)}/>
      </div>
      <div className="name-container result-sub">
        <span className="icon">{icon}</span>
        <span className="name">{item.subject.name.toUpperCase()}</span>
        <span className="effect">{capitalizeFirstLetter(predicate)}</span>
      </div>
      <div className="fda-container result-sub">
        {fdaLevel !== 'N/A' &&
          <span className="fda-icon"><CheckIcon /></span>
        }
        <span className="fda">{fdaLevel}</span>
      </div>
      <div className="evidence-container result-sub">
        <span className="evidence-link" onClick={()=>{activateEvidence(item.edge.evidence)}}>
          <span className="view-all">View All</span> ({evidenceCount})
        </span>
      </div>
      <div className="tags-container result-sub">
        <span className="tags">
          {
            // item.subject.toxicity_info.level &&
            // <span className={`tag toxicity`}>{item.subject.toxicity_info.level}</span>  
          }
          {
            lastPubYear &&
            <span className={`tag year`}>{lastPubYear}</span>  
          }
        </span>
      </div>
    </div>
  );
}

export default ResultsItem;