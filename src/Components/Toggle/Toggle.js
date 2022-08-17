import React, {useState} from "react";

const Toggle = ({labelOne, labelTwo, labelInternal, checked, onClick}) => {

  const [isChecked, setIsChecked] = useState((checked) ? true : false);

  let classList = (labelOne && labelTwo ) ? `${styles.toggle} ${styles.hasLabel}`: `${styles.toggle} ${styles.noLabel}`;
  classList += (labelInternal) ? ` ${styles.internal}`: ` ${styles.external}`;


  const handleChange = () => {
    setIsChecked(!isChecked);
    onClick();
  }

  return (

    <label className={`${classList} ${isChecked ? styles.true : styles.false}`}>
      {(labelOne && labelTwo && !labelInternal && 
        <span className={`${styles.label} ${styles.one}`}>{labelOne}</span>)}
      <input type="checkbox" onChange={handleChange} defaultChecked={checked}/>
      <span className={`${styles.slider} ${styles.round}`}>
        {(labelOne && labelTwo && labelInternal && 
          <span className={`${styles.label} ${styles.one}`}>{labelOne}</span>)}
        {(labelOne && labelTwo && labelInternal && 
          <span className={`${styles.label} ${styles.two}`}>{labelTwo}</span>)}
      </span>
      {(labelOne && labelTwo && !labelInternal && 
        <span className={`${styles.label} ${styles.two}`}>{labelTwo}</span>)}
    </label>

  );
}


export default Toggle;