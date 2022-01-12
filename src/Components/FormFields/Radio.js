import React, {useState} from "react";

const Radio = ({name, value, checked, children}) => {

  const [isChecked, setIsChecked] = useState(checked);

  let isCheckedClass = (isChecked) ? 'checked' : 'unchecked';


  const handleChange = () => {
    setIsChecked(!isChecked);
  }

  return (

    <label className={`radio ${isCheckedClass}`}>
      <span className="circle"></span>
      <input type="radio" defaultChecked={isChecked} name={name} value={value} onChange={handleChange} />
      <span>{children}</span>
    </label>

  );
}


export default Radio;