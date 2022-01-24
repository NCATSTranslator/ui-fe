import Button from '../FormFields/Button';
import Toggle from '../Toggle/Toggle';
import { NavLink, Link } from 'react-router-dom';
import {ReactComponent as Home} from '../../Icons/Navigation/Home.svg';
import {ReactComponent as Bookmark} from '../../Icons/Navigation/Bookmark.svg';
import {ReactComponent as History} from '../../Icons/Navigation/History.svg';
import {ReactComponent as Export} from '../../Icons/Buttons/Export.svg';
import {ReactComponent as Warning} from '../../Icons/Alerts/Warning.svg';
import {ReactComponent as Undo} from '../../Icons/Directional/Undo.svg';
import {ReactComponent as Redo} from '../../Icons/Directional/Redo.svg';


const Header = ({children}) => {


  return (
    <header className="header">
      <div className="top-bar">
        <div className="container">
          <div className='left'>
            <h5>Biomedical Data Translator</h5>
          </div>
          <div className='right'>
            <Link to="/"><Home/>Dashboard</Link>
            <Link to="/history"><History/>History</Link>
            <button><Bookmark/>Bookmarks</button>
            <button><Export />Share</button>
            <button><Warning/>Report Issue</button>
          </div>
        </div>
      </div>
      <div className="toolbar">
        <div className="container">
          <div className='left'>
            <Button isSecondary handleClick={()=>{}} size="m"><Undo/>Undo</Button>
            <Button isSecondary handleClick={()=>{}} size="m"><Redo/>Redo</Button>
            <Toggle labelInternal={false} labelOne="Lite" labelTwo="Pro" checked onClick={()=>{}} />
          </div>
          <div className='right'>
            <NavLink to="/" 
              className={({isActive}) => {return (isActive) ? 'active' : '' }}
            >Take a Tour</NavLink>
            <NavLink to="/templates" 
              className={({isActive}) => {return (isActive) ? 'active' : '' }}
            >Templated Queries</NavLink>
            <NavLink to="/build" 
              className={({isActive}) => {return (isActive) ? 'active' : '' }}
            >Build Your Own</NavLink>
            <NavLink to="/results" 
              className={({isActive}) => {return (isActive) ? 'active' : '' }}
            >Results</NavLink>
          </div>
        </div>
      </div>
        {children}
    </header>
  );
}

export default Header;