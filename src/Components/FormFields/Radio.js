import React, {useState,useEffect} from "react";

const Radio = ({name, value, checked, children, handleClick}) => {

  const [isChecked, setIsChecked] = useState(checked);

  let isCheckedClass = (isChecked) ? 'checked' : 'unchecked';
  
  const handleChange = () => {
    setIsChecked(!isChecked);
  }

  useEffect(() => {
    setIsChecked(checked);
  }, [checked])

  handleClick = (handleClick) ? handleClick : ()=>{ handleChange(); console.log('No handleClick function provided.') };

  return (

    <label className={`radio ${isCheckedClass}`}>
      <span className="circle"></span>
      <input type="radio" defaultChecked={isChecked} name={name} value={value} onChange={handleChange} onClick={handleClick}/>
      <span>{children}</span>
    </label>

  );
}


export default Radio;