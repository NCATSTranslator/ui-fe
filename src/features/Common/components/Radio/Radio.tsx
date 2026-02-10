import {useState, useEffect, ReactNode, FC} from "react";
import styles from './Radio.module.scss';
import { joinClasses } from "@/features/Common/utils/utilities";

type RadioProps = {
  className?: string;
  labelClassName?: string;
  name?: string;
  value?: string | number | undefined;
  checked?: boolean;
  children?: ReactNode;
  handleClick: ()=>void;
}

const Radio: FC<RadioProps> = ({
  className = "",
  labelClassName = "",
  name = "",
  value = undefined,
  checked = false,
  children,
  handleClick = undefined,
}) => {

  const [isChecked, setIsChecked] = useState(checked);
  let isCheckedClass = (isChecked) ? styles.checked : '';
  let radioClass = joinClasses(styles.radio, isCheckedClass, className);
  let labelClass = joinClasses(styles.label, labelClassName);
  
  const handleChange = () => {
    setIsChecked(!isChecked);
  }

  useEffect(() => {
    setIsChecked(checked);
  }, [checked])

  handleClick = (!!handleClick) ? handleClick : ()=>{ handleChange(); console.log('No handleClick function provided.') };

  return (
    <label className={radioClass}>
      <span className={styles.box}></span>
      <input 
        type="radio"
        defaultChecked={isChecked}
        name={name}
        value={value}
        onChange={handleChange}
        onClick={handleClick}
      />
      <span className={labelClass}>{children}</span>
    </label>
  );
}


export default Radio;