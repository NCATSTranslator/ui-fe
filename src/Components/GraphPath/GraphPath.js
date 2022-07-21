import styles from './GraphPath.module.scss';
import React, {useState, useEffect} from "react";
import Tooltip from '../Tooltip/Tooltip';
import { getIcon } from '../../Utilities/utilities';
import {ReactComponent as Disease} from '../../Icons/disease2.svg';
import {ReactComponent as Connector} from '../../Icons/connector-os.svg';
import {ReactComponent as Chemical} from '../../Icons/Queries/Chemical.svg';
import OutsideClickHandler from '../OutsideClickHandler/OutsideClickHandler';


const GraphPath = ({path, handleNameClick, handlePathClick, handleTargetClick}) => {

  const [nameTooltipActive, setNameTooltipActive] = useState(false);
  const [pathTooltipActive, setPathTooltipActive] = useState(false);
  const [targetTooltipActive, setTargetTooltipActive] = useState(false);

  const tooltipOpen = (type) => {
    switch (type) {
      case 'name':
        handleNameClick();
        setNameTooltipActive(true);
        break;
      case 'path':
        handlePathClick();
        setPathTooltipActive(true);
        break;   
      case 'target':
        handleTargetClick();
        setTargetTooltipActive(true);
        break; 
      default:
        break;
    }
  }

  const tooltipClose = (type = 'all') => {
    switch (type) {
      case 'name':
        if(nameTooltipActive)
          setNameTooltipActive(false)
        break;
      case 'path':
        if(pathTooltipActive)
          setPathTooltipActive(false)
        break;   
      case 'target':
        if(targetTooltipActive)
          setTargetTooltipActive(false)
        break; 
      default:
        setPathTooltipActive(false)
        setNameTooltipActive(false)
        setTargetTooltipActive(false)
        break;
    }
  }

  return (
    <>
      <span className={styles.nameContainer} >
        <span className={styles.name} onClick={() => tooltipOpen('name')}>
          {getIcon(path.type)}
          {path.name}
        </span>
        <OutsideClickHandler onOutsideClick={() => tooltipClose('name')}>
          <Tooltip 
            active={nameTooltipActive} 
            onClose={() => tooltipClose('name')}
            heading={path.name}
            text=''
            >
          </Tooltip>
        </OutsideClickHandler>
      </span>
      <span className={styles.pathContainer} onClick={()=> tooltipOpen('path')}>
        <Connector />
        <span className={`${styles.path} path`}>{path.path}</span>
        <OutsideClickHandler onOutsideClick={() => tooltipClose('path')}>
          <Tooltip 
            active={pathTooltipActive} 
            onClose={() => tooltipClose('path')}
            heading={path.path}
            text=''
            >
          </Tooltip>
        </OutsideClickHandler>
      </span>
      {path.target && 
      <span className={styles.target} onClick={()=> tooltipOpen('target')} >
        <Disease/>
        {path.target}
        <OutsideClickHandler onOutsideClick={() => tooltipClose('target')}>
          <Tooltip 
            active={targetTooltipActive} 
            onClose={() => tooltipClose('target')}
            heading={path.target}
            text='A metabolic disorder characterized by abnormally high blood sugar levels due to diminished production of insulin or insulin resistance/desensitization. '
            >
          </Tooltip>
        </OutsideClickHandler>
      </span>}    
    </>
  )
}

export default GraphPath;