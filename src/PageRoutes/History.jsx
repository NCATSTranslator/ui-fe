import { queryState } from "../Redux/store";
import { useSelector } from 'react-redux'

const History = () => {

  const queryHistoryState = useSelector(queryState);
  console.log(queryHistoryState);

  return (
    <div>
      <h2>History</h2>
      <ul className="history-list">
        {
          queryHistoryState.map((query, i)=> {
            console.log(query);
            return (
              <li key={i} className="history-item">
                <span>{i+1}: </span>
                {query.map((item, j) => {
                  return (
                    <span key={j}>{item.name} </span>)
                  })
                }
              </li>
            )
          })
        }
      </ul>
    </div>
  );
}

export default History;