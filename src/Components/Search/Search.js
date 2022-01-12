import React from "react";
import {ReactComponent as SearchIcon} from '../../Icons/Buttons/Search.svg'

const Search = ({iconInternal, handleClick, size }) => {

  const containerClass = (iconInternal) ? 'internal' : 'external';
  size = (size === undefined) ? 's' : size;
  
  return (
    <div className={`search-container ${containerClass} ${size}`}> 
      <input type="text" placeholder="Search" className="search-input"/>
      {!iconInternal && <button className="search-button" onClick={handleClick}><SearchIcon /></button>}
    </div>
  );
}

export default Search;