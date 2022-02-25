import { getIcon } from "../../Utilities/utilities";

const QueryItemButton = ({handleClick, item, disabled, children}) => {

  const isDisabled = (disabled === undefined) ? false : disabled;
  const icon = getIcon(item.category);

  return (
    <button onClick={handleClick} className={`query-item-button ${isDisabled}`}>
      {icon}
      {children}
    </button>
  );
}

export default QueryItemButton;