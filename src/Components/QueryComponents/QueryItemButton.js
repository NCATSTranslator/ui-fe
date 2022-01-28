
const QueryItemButton = ({handleClick, item, disabled, children}) => {

  const isDisabled = (disabled === undefined) ? false : disabled;

  return (
    <button onClick={handleClick} className={`query-item-button ${isDisabled}`}>
      {children}
    </button>
  );
}

export default QueryItemButton;