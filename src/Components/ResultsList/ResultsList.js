import Checkbox from "../FormFields/Checkbox";
import Query2 from "../Query/Query2";
import ResultsFilter from "../ResultsFilter/ResultsFilter";
import { useState } from "react";

const ResultsList = () => {

  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const exampleResults = [
    {
      name: 'estradiol benzoate',
      effect: 'Downregulates CCND1, CCND2, CCND3',
      fda: 3,
      evidence: 23,
      tags: ['2022', 'FDA', 'High']
    },
    {
      name: 'tretinoin',
      effect: 'Downregulates CCND2, CCND3',
      fda: 3,
      evidence: 42,
      tags: ['2022', 'FDA', 'Med']
    },
    {
      name: '2-AMINO-1-METHYL-6- PHENYLIMIDAZO[4,5- B]PYRIDINE',
      effect: 'Downregulates CCND1',
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
      <ResultsFilter/>
      <div className="results-container">
        <table className="results-table">
          <thead>
            <tr>
              <th><Checkbox handleClick={()=>{setSelectAll(true);}}/></th>
              <th>Name</th>
              <th>FDA</th>
              <th>Evidence</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {
              exampleResults.map((item, i)=> {
                return(
                  <tr key={i}>
                    <td>
                    <Checkbox checked={selectAll}/>
                    </td>
                    <td>
                      <span className="name">{item.name}</span>
                      <span className="effect">{item.effect}</span>
                    </td>
                    <td>
                      <span className="fda">{item.fda}</span>
                    </td>
                    <td>
                      <span className="evidence">View All ({item.evidence})</span>
                    </td>
                    <td>
                      <span className="tags">
                        {item.tags.map((tag, j) => {
                          return (
                            <span key={j}>{tag}</span>  
                          )
                        })}
                      </span>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
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