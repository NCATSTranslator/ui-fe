import { queryState } from "../Redux/store";
import { useSelector } from 'react-redux'

const History = () => {

  const queryHistoryState = useSelector(queryState);
  console.log(queryHistoryState);

  return (
    <div>
      <h2>History</h2>
      {
        queryHistoryState.map((query, i)=> {
          console.log(query);
          return (
            <p key={i}>
              <span>{i+1}: </span>
              {query.map((item, j) => {
                return (
                  <span key={j}>{item.name} </span>)
                })
              }
            </p>
          )
        })
      }
    </div>
  );
}

export default History;