import React, {useState, useEffect} from "react";
import { Range, getTrackBackground } from 'react-range';

const SimpleRange = ({min, max, step, initialValue, label, hideLabel, onChange, style, children}) => {

  let initialValues = (initialValue) ? [initialValue] : [1];
  const [values, setValues] = useState(initialValues);
  let rtl = false;

  onChange = (onChange) ? onChange : ()=>{};

  let labelClass = (hideLabel) ? 'no-label': 'label';

  const handleChange = (values) => {
    setValues(values)
    onChange(values[0]);
  }

  useEffect(() => {
  }, [])

  return (
    <div className={`range-container ${labelClass}`}>
      <span className="min">{min}</span>

      <Range
        step={step}
        min={min}
        max={max}
        values={values}
        onChange={(values) => handleChange(values)}
        renderTrack={({ props, children }) => (

            <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
              ref={props.ref}
              style={{
                cursor: 'pointer',
                background: getTrackBackground({
                  values,
                  colors: ['#662E6B', '#606368'],
                  min: min,
                  max: max,
                  rtl
                }),
                alignSelf: 'center'
              }}
              className="range-track"
            >
              {children}
            </div>
        )}
        renderThumb={({ props, isDragged }) => (
          <div {...props} className="thumb-container" >
            <div className="value" >
              {values[0]}
            </div>
            <div className="thumb"  />
          </div>
        )}
      />
      <span className="max">{max}</span>
    </div>
  );
}


export default SimpleRange;