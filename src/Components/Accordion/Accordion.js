import React, {useState, useEffect} from "react";
import AnimateHeight from "react-animate-height";
import { NavLink } from "react-router-dom";
import styles from './Accordion.module.scss';
import {ReactComponent as ChevDown } from "../../Icons/Directional/Property 1 Down.svg"

const Accordion = ({title, titleLink, navLink, extLink, children, expanded, accordionClass, panelClass, icon}) => {

  expanded = (expanded) ? true : false;
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [height, setHeight] = useState(0);

  icon = (icon) ? icon : <ChevDown/>;
  let expandedClass = (isExpanded) ? styles.open : styles.closed;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  return (
    <div className={`${styles.accordion} accordion ${expandedClass} ${accordionClass}`}>
      {
        titleLink && 
        <span className={`${styles.accordionButton} ${styles.titleLink}`}>
          {
            navLink && 
            <NavLink 
              to={titleLink}
              className={({ isActive }) =>
                isActive ? `${styles.active} ${styles.navLink}` : styles.navLink
              }
              >
              {title}
              <button className={`${styles.accordionButton}`} onClick={(e)=>{e.preventDefault(); handleToggle();}}>
                {icon}
              </button>
            </NavLink>
          }
          {
            extLink &&
            <a 
              href={titleLink} 
              target="_blank" 
              rel="noreferrer"
              className={styles.extLink}
              >
              {title}
              <button className={`${styles.accordionButton}`} onClick={(e)=>{e.preventDefault(); handleToggle();}}>
                {icon}
              </button>
            </a>
          }
          {
            !navLink && !extLink &&
            <a href={titleLink}>{title}
              <button className={`${styles.accordionButton}`} onClick={(e)=>{e.preventDefault(); handleToggle();}}>
                {icon}
              </button>
            </a>
          }
        </span>
      }
      {
        !titleLink &&
        <button className={`${styles.accordionButton}`} onClick={handleToggle}>
          {title}
        </button>
      }
      <AnimateHeight className={`${styles.accordionPanel} ${panelClass} ${expandedClass}`}
          duration={250}
          height={height}
        > 
        {children}
      </AnimateHeight>
    </div>
  );

}

export default Accordion;