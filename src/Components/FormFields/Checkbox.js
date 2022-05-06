import React, {useState, useEffect} from "react";

const Checkbox = ({name, value, checked, children, handleClick}) => {

  const [isChecked, setIsChecked] = useState(checked);

  let isCheckedClass = (isChecked) ? 'checked' : 'unchecked';

  const handleChange = () => {
    setIsChecked(!isChecked);
    handleClick();
  }
  
  useEffect(() => {
    setIsChecked(checked);
  }, [checked])

  return (

    <label className={`checkbox ${isCheckedClass}`}>
      <span className="circle" ></span>
      <input type="checkbox" defaultChecked={isChecked} name={name} value={value} onChange={handleChange} />
      <span>{children}</span>
    </label>

  );
}


export default Checkbox;