import React, {useState, useEffect} from "react";
import Button from "../FormFields/Button";
import {ReactComponent as Warning} from '../../Icons/Alerts/Warning.svg'
import {ReactComponent as Info} from '../../Icons/Alerts/Info.svg'
import {ReactComponent as Checkmark} from '../../Icons/Alerts/Checkmark.svg'
import {ReactComponent as Cross} from '../../Icons/Alerts/Cancelled.svg'
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg'
import { Fade } from "react-awesome-reveal";

const Alert = ({ active, type, toggle, verticalPosition, horizontalPosition, timeout, fade, buttonText, children }) => {

  verticalPosition = (verticalPosition) ? verticalPosition : 'middle';
  horizontalPosition = (horizontalPosition) ? horizontalPosition : 'middle';
  timeout = (timeout) ? timeout : 3000;
  fade = (fade) ? fade : 1500;
  timeout += fade;

  const isToggle = toggle;
  const [isActive, setActive] = useState(active);
  const [isFading, setIsFading] = useState(false);

  let fadeClass = (isFading) ? 'fade-out' : 'fade-in';
  let containerClass = type + " " + verticalPosition + " " + horizontalPosition;
  let icon = <></>;

  switch(type) {
    case 'success': 
      icon = <Checkmark />;
      break;

    case 'warning': 
      icon = <Warning />;
      break;

    case 'error': 
      icon = <Cross />;
      break;

    default:
      icon = <Info />;
      break;
  }

  const fadeOut = () => {
    setIsFading(true);
      const timer = setTimeout(() => {
        setIsFading(false);
        setActive(false);
      }, 2000 );
      return () => {
        clearTimeout(timer);
      }
  }

  useEffect(() => {
    if(isActive && !isToggle) {
      const timer = setTimeout(() => {
        fadeOut();
      }, timeout );
      return () => {
        clearTimeout(timer);
      }
    }
  }, [isActive, isFading, timeout, isToggle])

  return (

    <div className="alert">
      {buttonText && 
        <Button handleClick={() => {setActive(true);}}>{buttonText}</Button>
      }
      {isActive && 
        <Fade className={`alert-container ${containerClass} ${fadeClass}`} duration={fade}> 
          <div className="container">
            {isToggle && <button className="close" onClick={fadeOut}><Close/></button>}
            <span className="icon">{icon}</span>
            <div className="content">
              {children}
            </div>
          </div>
        </Fade>
      }
    </div>

  );
}

export default Alert;