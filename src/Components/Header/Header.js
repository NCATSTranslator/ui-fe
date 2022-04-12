import React, {useState} from "react";
import Button from '../FormFields/Button';
import TextInput from "../FormFields/TextInput";
import Checkbox from "../FormFields/Checkbox";
import Select from "../FormFields/Select";
import Toggle from '../Toggle/Toggle';
import ReportIssueModal from "../Modals/SendFeedbackModal";
import { NavLink, Link } from 'react-router-dom';
import {ReactComponent as Home} from '../../Icons/Navigation/Home.svg';
import {ReactComponent as Bookmark} from '../../Icons/Navigation/Bookmark.svg';
import {ReactComponent as History} from '../../Icons/Navigation/History.svg';
import {ReactComponent as Export} from '../../Icons/Buttons/Export.svg';
import {ReactComponent as Warning} from '../../Icons/Alerts/Warning.svg';
import {ReactComponent as Undo} from '../../Icons/Directional/Undo.svg';
import {ReactComponent as Redo} from '../../Icons/Directional/Redo.svg';


const Header = ({children}) => {

  const [modalOpen, setModalOpen] = useState(false);
  const handleModalClose = () => {
    setModalOpen(false);
  }
  
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
            <button onClick={()=>setModalOpen(true)}><Warning/>Send Feedback</button>
          </div>
        </div>
        <ReportIssueModal isOpen={modalOpen} onClose={()=>handleModalClose()} />
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