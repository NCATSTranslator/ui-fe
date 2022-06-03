import React, { useState, useEffect } from 'react';
import { getIcon, capitalizeFirstLetter, getLastPubYear } from '../../Utilities/utilities';
import Checkbox from "../FormFields/Checkbox";
import {ReactComponent as CheckIcon } from "../../Icons/Buttons/Circle Checkmark.svg"
import {ReactComponent as ChevDown } from "../../Icons/Directional/Property 1=Down.svg"
import AnimateHeight from "react-animate-height";


const ResultsItem = ({key, item, staticNode, allSelected, handleSelected, activateEvidence, checked, highlighted}) => {

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
    
  let lastPubYear = getLastPubYear(item.edge.last_publication_date);

  let predicate = (item.edge.predicate)
    ? item.edge.predicate.replace("biolink:", '') + ' ' + staticNode.names[0]
    : '';
  
  checked = (allSelected || checked) ? true : false;
  let highlightedClass = (highlighted) ? 'highlighted' : false;

  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);

  let expandedClass = (isExpanded) ? 'open' : 'closed';

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  return (
    <div key={key} className={`result ${highlightedClass}`}>
      <div className="checkbox-container result-sub">
        <Checkbox checked={checked} handleClick={()=>handleSelected(item)}/>
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
      <button className={`accordion-button ${expandedClass}`} onClick={handleToggle}>
        <ChevDown/>
      </button>
      <AnimateHeight className={`accordion-panel ${expandedClass}`}
          duration={250}
          height={height}
        > 
        <div className='container'>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non sem vel libero tincidunt consectetur et et turpis. Vestibulum venenatis sagittis libero, eu dapibus nibh consequat id. Fusce pharetra nisi eget velit facilisis molestie. Ut orci neque, pellentesque eu mauris sed, efficitur lacinia libero. Etiam et dolor eget diam mattis tristique sed ut felis. Nunc blandit consequat aliquam. Donec hendrerit faucibus nisi, at molestie nunc pretium lobortis. Sed dapibus tristique ipsum, et vulputate quam tristique ut. Nullam fermentum enim nunc, sed vestibulum ipsum volutpat eget. Proin arcu turpis, mollis in consequat in, congue sed lacus. Aliquam gravida eu leo eu mattis. Ut vehicula felis vel enim sollicitudin dictum. Duis suscipit purus et neque efficitur congue. Donec euismod vulputate arcu, sed venenatis lacus ullamcorper nec.</p>
          <p>Nam ex justo, tincidunt ut metus quis, egestas posuere risus. Maecenas rhoncus purus ac porttitor mollis. Morbi vehicula lorem id lorem commodo consectetur. Phasellus lobortis nibh id massa mollis, condimentum feugiat quam tempor. Etiam condimentum iaculis lorem, eget faucibus nibh ultrices ac. Sed scelerisque sagittis augue, et iaculis velit sagittis sit amet. Sed molestie leo risus, eget lobortis libero tempus sit amet. Vivamus eu egestas quam, non interdum eros. Morbi non vehicula nibh. Curabitur facilisis sit amet sapien quis molestie. Quisque commodo suscipit nunc eu iaculis. </p>
        </div>
      </AnimateHeight>

    </div>
  );
}

export default ResultsItem;