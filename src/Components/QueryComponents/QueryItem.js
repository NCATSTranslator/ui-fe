import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';

const QueryItem = ({handleClick, handleClose, item, name, children, hasInput}) => {

  return (
    <span onClick={handleClick} className={`query-item`}>
      {hasInput &&
        <input type="text" className="input" />
      }
      <div className="query-item-container"><p>{name}</p></div>
      <div onClick={handleClose} className="remove"><Close/></div>
      {children}
    </span>
  );
}

export default QueryItem;