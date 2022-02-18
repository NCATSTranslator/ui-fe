import Checkbox from "../FormFields/Checkbox";
import { useState } from "react";

const ResultsList = () => {

  const [selectAll, setSelectAll] = useState(false);

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

  return (
    <div className="results-list">
      <table>
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

    </div>
  );
}

export default ResultsList;