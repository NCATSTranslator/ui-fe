
const QueryTemplate = ({handleClick, items}) => {


  return (
    <button onClick={handleClick} className="query-template">
      {
        items.map((item, index)=> {
          return (
            <span key={index}>{item.name}</span>
          )
        })
      }
    </button>
  );
}

export default QueryTemplate;