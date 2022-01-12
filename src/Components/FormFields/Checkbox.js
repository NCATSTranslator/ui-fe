import React, {useState} from "react";

const Checkbox = ({name, value, checked, children}) => {

  const [isChecked, setIsChecked] = useState(checked);

  let isCheckedClass = (isChecked) ? 'checked' : 'unchecked';


  const handleChange = () => {
    setIsChecked(!isChecked);
  }

  return (

    <label className={`checkbox ${isCheckedClass}`}>
      <span className="circle"></span>
      <input type="checkbox" defaultChecked={isChecked} name={name} value={value} onChange={handleChange} />
      <span>{children}</span>
    </label>

  );
}


export default Checkbox;