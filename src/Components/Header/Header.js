import React from "react";
import { Link } from 'react-router-dom';
import {ReactComponent as Logo} from '../../Assets/Images/Logo.svg';
import styles from './Header.module.scss';


const Header = ({children, handleFeedbackModalOpen}) => {
  
  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.left}>
            <Link to="/" className={styles.logo}><Logo/></Link>
          </div>
          <div className={styles.right}>
            <Link to="/history">Search History</Link>
            <button onClick={()=>handleFeedbackModalOpen()}>Send Feedback</button>
            <Link to="/help" className={styles.help}>Help</Link>
          </div>
        </div>
      </div>
      {/* <div className="toolbar">
        <div className="container">
          <div className='left'>
            <UndoRedo />
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
      </div> */}
        {children}
    </header>
  );
}

export default Header;