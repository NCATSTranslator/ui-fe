import React, {useState, useEffect, createRef} from "react";
import { Range, getTrackBackground } from 'react-range';

const TwoThumbRange = ({min, max, step, initialValues, label, hideLabel, onChange, style, children}) => {

  const [values, setValues] = useState(initialValues);
  let rtl = false;

  onChange = (onChange) ? onChange : ()=>{};

  let labelClass = (hideLabel) ? 'no-label': 'label';

  const handleChange = (values) => {
    setValues(values)
    onChange(values);
  }

  useEffect(() => {
  }, [])

  return (
    <div className={`range-container ${labelClass} two-thumb`}>
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
                  colors: ['#606368', '#662E6B', '#606368'],
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
        renderThumb={({ index, props, isDragged }) => (
          <div {...props} className="thumb-container" >
            <div className="value" >
              {values[index]}
            </div>
            <div className="thumb"  />
          </div>
        )}
      />
      <span className="max">{max}</span>
    </div>
  );
}


export default TwoThumbRange;