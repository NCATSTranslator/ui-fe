import React, {useState, useEffect, createRef} from "react";

const Range = ({min, max, step, label, hideLabel, onChange}) => {

  const [value, setValue] = useState(min);
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(10);

  const inputRef = createRef();
  
  onChange = (onChange) ? onChange : ()=>{};
  step = (step) ? step : 1;
  let labelClass = (hideLabel) ? 'no-label': 'label';

  const thumbWidth = 16;

  const handleChange = (e) => {
    setValue(e.target.value);
    onChange(e);
    var off = (inputRef.current.clientWidth - thumbWidth) / (max - min);
    var px = ((value - min) * 100) / (max - min);
    setTop(thumbWidth / 2);
    setLeft(px);
  }

  useEffect(() => {
  }, [])

  return (
    <div className={`range-container ${labelClass}`}>
      <label htmlFor={label}>{label}</label>
      <span className="min">{min}</span>
      <div className="bar-container">
        <input 
          type="range" 
          id={label} 
          name={label} 
          min={min} 
          max={max} 
          onChange={handleChange}
          value={value}
          ref={inputRef}
        />
        {/* Not perfect calculation, reimplement later */}
        <span className="fill" style={{position: 'absolute', top: "-1px", left: "2px", right: `calc((100% - ${left}%) - (${6 - left * 0.15}px))`}}></span>
        <span className="value" style={{position: 'absolute', top: top, left: `calc(${left}% + (${4 - left * 0.15}px))`}}>{value}</span>
      </div>
      <span className="max">{max}</span>
    </div>
  );
}


export default Range;