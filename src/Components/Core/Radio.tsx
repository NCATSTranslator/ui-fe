import {useState, useEffect, ReactNode, FC} from "react";
import styles from './Radio.module.scss';

type RadioProps = {
  name?: string;
  value?: string | number | undefined;
  checked?: boolean;
  children?: ReactNode;
  handleClick: ()=>void;
}

const Radio: FC<RadioProps> = ({name = "", value = undefined, checked = false, children, handleClick = undefined}) => {

  const [isChecked, setIsChecked] = useState(checked);
  let isCheckedClass = (isChecked) ? styles.checked : styles.unchecked;
  
  const handleChange = () => {
    setIsChecked(!isChecked);
  }

  useEffect(() => {
    setIsChecked(checked);
  }, [checked])

  handleClick = (!!handleClick) ? handleClick : ()=>{ handleChange(); console.log('No handleClick function provided.') };

  return (
    <label className={`${styles.radio} ${isCheckedClass}`}>
      <span className={styles.box}></span>
      <input 
        type="radio" 
        defaultChecked={isChecked} 
        name={name} 
        value={value} 
        onChange={handleChange} 
        onClick={handleClick}
      />
      <span>{children}</span>
    </label>
  );
}


export default Radio;