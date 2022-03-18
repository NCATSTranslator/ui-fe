import { useState } from "react";
import Checkbox from "../FormFields/Checkbox";
import Query2 from "../Query/Query2";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import {ReactComponent as CheckIcon } from "../../Icons/Buttons/Circle Checkmark.svg"
import { getIcon } from "../../Utilities/utilities";

const ResultsList = () => {

  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const exampleResults = [
    {
      name: 'estradiol benzoate',
      effect: 'Downregulates CCND1, CCND2, CCND3',
      type: 'chemical',
      fda: 3,
      evidence: 23,
      tags: ['2022', 'FDA', 'High']
    },
    {
      name: 'tretinoin',
      effect: 'Downregulates CCND2, CCND3',
      type: 'chemical',
      fda: 3,
      evidence: 42,
      tags: ['2022', 'FDA', 'Med']
    },
    {
      name: '2-AMINO-1-METHYL-6- PHENYLIMIDAZO[4,5- B]PYRIDINE',
      effect: 'Downregulates CCND1',
      type: 'chemical',
      fda: 4,
      evidence: 121,
      tags: ['2022', 'Med']
    }
  ]

  const exampleKPResults = [
    {name: 'BTE', value: '54', error: false},
    {name: 'CHP', value: '0', error: false},
    {name: 'COHD', value: '0', error: false},
    {name: 'RTX-KG2', value: '6', error: false},
    {name: 'NGD', value: '0', error: false},
    {name: 'MolePro', value: '3', error: false},
    {name: 'GeneticsKP', value: '0', error: true},
  ]
  
  return (
    <div className="results-list">
      <Query2 results/>
      <div className="results-container">
        <div className="table-container">
          <ResultsFilter/>
          <div className="results-table">
            <div className="table-body">
              <div className="table-head result">
                  <div className="checkbox-container checkbox-head">
                    <Checkbox handleClick={()=>{setSelectAll(true);}}/>
                  </div>
                  <div className="name-head head">Name</div>
                  <div className="fda-head head">FDA</div>
                  <div className="evidence-head head">Evidence</div>
                  <div className="tags-head head">Tags</div>
              </div>
              {
                exampleResults.map((item, i)=> {
                  console.log(item);
                  let icon = getIcon(item.type);
                  return(
                    <div key={i} className="result">
                      <div className="checkbox-container result-sub">
                        <Checkbox checked={selectAll}/>
                      </div>
                      <div className="name-container result-sub">
                        <span className="icon">{icon}</span>
                        <span className="name">{item.name}</span>
                        <span className="effect">{item.effect}</span>
                      </div>
                      <div className="fda-container result-sub">
                        <span className="fda-icon"><CheckIcon /></span>
                        <span className="fda">{item.fda}</span>
                      </div>
                      <div className="evidence-container result-sub">
                        <span className="evidence-link"><span className="view-all">View All</span> ({item.evidence})</span>
                      </div>
                      <div className="tags-container result-sub">
                        <span className="tags">
                          {item.tags.map((tag, j) => {
                            return (
                              <span key={j} className={`tag ${tag}`}>{tag}</span>  
                            )
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>
        </div>
        <div className="kps">
          <h6>Knowledge Providers</h6>
          <p>Found in <span className="time">1.8 seconds</span></p>
          <ul className="kp-list">
          {
            exampleKPResults.map((item, index)=> {
              let itemClass = "kp";
              itemClass += (item.error) ? " error" : "";
              itemClass += (item.value < 1) ? " no-results" : "";
              return(
                <li key={index} className={`${itemClass}`}>
                  <span className="kp-name">{item.name}</span>
                  <span className="kp-value sub-one">{item.value}</span>
                </li>
              )
            })
          }
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ResultsList;