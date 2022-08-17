import React, {useState} from "react";
import styles from './Button.module.scss';

const Button = ({isSecondary, handleClick, href, iconOnly, _blank, type, size, children, disabled}) => {

  let buttonStyle = (isSecondary) ? styles.secondary : styles.primary;
  buttonStyle += (iconOnly) ? styles.iconOnly : '';

  size = (size === undefined) ? 's' : size;
  type = (type) ? type : '';

  const [clicked, setClicked] = useState(false);
  
  if(handleClick === undefined) {
    handleClick = (e) => {
      setClicked(true);
    }
  }
  
  return ( 
    <> 
      {href && 
        <a 
          className={`button ${styles.button} ${buttonStyle} ${clicked && styles.clicked} ${size}`} 
          onClick={handleClick} 
          href={href} 
          target={_blank && '_blank'}
        >
          {children}
        </a>
      }
      {!href && 
        <button 
          className={`button ${styles.button} ${buttonStyle} ${clicked && styles.clicked} ${size}`} 
          type={type} 
          onClick={handleClick}
          disabled={disabled}
        >
          {children}
        </button>
      }
    </>
  );
}

export default Button;