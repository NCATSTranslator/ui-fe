import React, { useState } from "react";
import { Range, getTrackBackground } from 'react-range';
import styles from './Range.module.scss';

const SimpleRange = ({min, max, step, initialValue, label, hideLabel, onChange, style, children}) => {

  let initialValues = (initialValue) ? [initialValue] : [1];
  const [values, setValues] = useState(initialValues);
  let rtl = false;

  onChange = (onChange) ? onChange : ()=>{};

  let labelClass = (hideLabel) ? styles.noLabel: styles.label;

  const handleChange = (values) => {
    setValues(values)
    onChange(values[0]);
  }

  return (
    <div className={`${styles.rangeContainer} ${labelClass}`}>
      <span className={styles.min}>{min}</span>

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
            className={styles.rangeTrack}
          >
            {children}
          </div>
        )}
        renderThumb={({ props, isDragged }) => (
          <div {...props} className={styles.thumbContainer}>
            <div className={styles.value}>
              {values[0]}
            </div>
            <div className={styles.thumb} />
          </div>
        )}
      />
      <span className={styles.max}>{max}</span>
    </div>
  );
}


export default SimpleRange;